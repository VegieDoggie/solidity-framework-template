import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";
import {
    AddressLike,
    BaseContract,
    BytesLike,
    Contract,
    ContractRunner,
    FunctionFragment,
} from "ethers"
import {ethers} from "hardhat"
import {DiamondCutFacet, DiamondLoupeFacet, OwnershipFacet} from "./typechain-types"
import {DeployHelper} from "./DeployHelper"
import DiamondAbi from "./abi/Diamond.json"

export type Diamond = DiamondCutFacet & DiamondLoupeFacet & OwnershipFacet & {
    address: string,
    logic: {
        diamondCutFacet: string,
        diamondLoupeFacet: string,
        ownershipFacet: string,
    },
    deployProxy: typeof DiamondProxyInner.prototype.deployProxy,
    upgradeProxy: typeof DiamondProxyInner.prototype.upgradeProxy,
    encode: typeof DiamondProxyInner.prototype.encode,
}

export const FacetCutAction = {Add: 0, Replace: 1, Remove: 2}

export type Selectors = string[] & {
    contract: BaseContract,
    clone: (functionNameOrSigs: string[], exclude?: boolean) => Selectors,
    names: () => { [name: string]: string }
}

export class DiamondProxy {
    static NewContract = async (isVerify: boolean, signer?: HardhatEthersSigner): Promise<Diamond> => {
        signer ??= (await ethers.getSigners())[0]
        const [
            diamondInit,
            diamondCutFacet,
            diamondLoupeFacet,
            ownershipFacet,
        ] = await DeployHelper.deploy(isVerify, "DiamondInit", "DiamondCutFacet", "DiamondLoupeFacet", "OwnershipFacet")

        const [diamondProxy] = await DeployHelper.deploy(isVerify, ["Diamond", [signer.address, diamondCutFacet.address]])

        const diamond = new Contract(diamondProxy.address, DiamondAbi, signer) as any as Diamond
        diamond.address = diamondProxy.address
        diamond.logic = {
            diamondCutFacet: diamondCutFacet.address,
            diamondLoupeFacet: diamondLoupeFacet.address,
            ownershipFacet: ownershipFacet.address,
        }

        const tx = await diamond.diamondCut([
            {
                facetAddress: diamondLoupeFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: DiamondProxy.parseSelectors(diamondLoupeFacet),
            },
            {
                facetAddress: ownershipFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: DiamondProxy.parseSelectors(ownershipFacet),
            }
        ], diamondInit.address, diamondInit.interface.encodeFunctionData("init"))
        await tx.wait()

        return DiamondProxy.withInner(diamond)
    }

    static NewContractAt = (diamond: string, runner?: ContractRunner | null | undefined): Diamond => {
        return DiamondProxy.withInner(new Contract(diamond, DiamondAbi, runner) as any as Diamond)
    }

    static parseSelectors = (contract: BaseContract, funcHeaderOrSigs?: string[]) => {
        let selectors: Selectors = [] as any

        contract.interface.forEachFunction((func: FunctionFragment) => {
            selectors.push(func.selector)
        })

        selectors.contract = contract
        selectors.names = function () {
            let names = {} as { [name: string]: string }
            contract.interface.forEachFunction((func: FunctionFragment) => {
                for (let selector of this) {
                    if (func.selector == selector) {
                        names[selector] = func.format("minimal")
                        break
                    }
                }
            })
            return names
        }

        selectors.clone = function (funcHeaderOrSigs: string[], exclude?: boolean) {
            const selectors = this.filter((selector: string) => {
                for (const funcHeaderOrSig of funcHeaderOrSigs) {
                    if (selector === DiamondProxy.parseSelector(funcHeaderOrSig)) {
                        return !exclude
                    }
                }
                return exclude
            }) as Selectors
            selectors.contract = this.contract
            selectors.clone = this.clone.bind(selectors)
            selectors.names = this.names.bind(selectors)
            return selectors
        }

        if (funcHeaderOrSigs?.length) selectors = selectors.clone(funcHeaderOrSigs)
        return selectors
    }

    private static withInner = (diamond: Diamond): Diamond => {
        const inner = new DiamondProxyInner(diamond)
        diamond.deployProxy = inner.deployProxy
        diamond.upgradeProxy = inner.upgradeProxy
        diamond.encode = inner.encode

        return diamond
    }

    private static parseSelector = (funcHeaderOrSig: string) => {
        if (funcHeaderOrSig.startsWith("0x")) {
            return funcHeaderOrSig
        }

        if (funcHeaderOrSig.includes("(")) {
            return FunctionFragment.from(funcHeaderOrSig).selector
        }
    }
}

class DiamondProxyInner {
    readonly diamond: Diamond

    constructor(diamond: Diamond) {
        this.diamond = diamond
    }

    deployProxy = async (newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        return await this._run(undefined, newFacet, init, initData)
    }

    upgradeProxy = async (oldFacet: AddressLike, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        return await this._run(oldFacet, newFacet, init, initData)
    }

    encode = {
        deployProxy: async (newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
            return await this._encode(undefined, newFacet, init, initData)
        },
        upgradeProxy: async (oldFacet: AddressLike, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
            return await this._encode(oldFacet, newFacet, init, initData)
        }
    }

    private _run = async (oldFacet: AddressLike | undefined, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        const data = await this._encode(oldFacet, newFacet, init, initData)
        if (this.diamond?.runner?.sendTransaction) {
            const tx = await this.diamond.runner.sendTransaction({
                to: this.diamond.address,
                data: data
            })
            return await tx.wait()
        }
        throw new Error("Signer not exist!")
    }

    private _encode = async (oldFacet: AddressLike | undefined, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        const chainSelectors = !oldFacet ? [] : await this.diamond.facetFunctionSelectors(oldFacet)
        const localSelectors = DiamondProxy.parseSelectors(newFacet)
        const onlyLocals = localSelectors.filter(item => !chainSelectors.includes(item))
        const onlyChains = chainSelectors.filter(item => !localSelectors.includes(item))
        const bothExists = chainSelectors.filter(chainSelector => {
            for (let localSelector of localSelectors) {
                if (chainSelector === localSelector) {
                    return true
                }
            }
        })
        const cut = []
        const newContractAddress = await newFacet.getAddress()
        // FacetCut Add
        if (onlyLocals.length) {
            cut.push({
                facetAddress: newContractAddress,
                action: FacetCutAction.Add,
                functionSelectors: onlyLocals
            })
        }
        // FacetCut Remove
        if (onlyChains.length) {
            cut.push({
                facetAddress: ethers.ZeroAddress,
                action: FacetCutAction.Remove,
                functionSelectors: onlyChains
            })
        }
        // FacetCut Replace
        if (bothExists.length) {
            cut.push({
                facetAddress: newContractAddress,
                action: FacetCutAction.Replace,
                functionSelectors: bothExists
            })
        }
        if (cut.length == 0) throw new Error("Nothing need to upgrade!")
        return this.diamond.interface.encodeFunctionData("diamondCut", [cut, init ?? ethers.ZeroAddress, initData ?? "0x"])
    }
}

