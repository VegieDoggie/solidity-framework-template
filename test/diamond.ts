import {ethers} from "hardhat";
import {Example} from "../typechain-types";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers"
import {DiamondProxy,DeployHelper} from "../scripts/diamond-2";

describe("Diamond", () => {
    let user: HardhatEthersSigner
    before("user", async () => {
        const accounts = await ethers.getSigners()
        user = accounts[0]
    })

    async function deployFixture() {
        return await DiamondProxy.NewContract(false)
    }

    it("proxy a logic", async () => {
        const diamond = await loadFixture(deployFixture);
        const [example] = await DeployHelper.deploy(false, "Example")
        await diamond.deployProxy(example);
        await (await (example.attach(diamond.address) as Example).setNumber(1024n)).wait()
        expect(await (example.attach(diamond.address) as Example).getNumber()).eq(1024n)
    });
    it("upgrade a logic", async () => {
        const diamond = await loadFixture(deployFixture);
        const [oldExample] = await DeployHelper.deploy(false, "Example")
        await diamond.deployProxy(oldExample)
        const [newExample] = await DeployHelper.deploy(false, "Example")
        await diamond.upgradeProxy(oldExample.address, newExample)
        // assert
        const selector = (newExample as any as Example).interface.getFunction("setNumber").selector
        expect(await diamond.facetAddress(selector)).eq(newExample.address)
    });
});
