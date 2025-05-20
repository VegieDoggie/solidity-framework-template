import {HardhatUserConfig, vars} from "hardhat/config";
import {Fragment, FunctionFragment} from "ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "hardhat-diamond-abi";
import "dotenv/config";

const RPC_URL = process.env.RPC_URL as string;
const API_KEY = process.env.API_KEY as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

// hardhat env vars
// const XXX = vars.get("XXX");

const config: HardhatUserConfig = {
        etherscan: {
            apiKey: {
                mainnet: API_KEY,
                bsc: API_KEY,
                arbitrumOne: API_KEY,
                base: API_KEY,
                arbitrumTestnet: API_KEY,
            },
        },
        networks: {
            mainnet: {
                chainId: 1,
                url: RPC_URL,
                accounts: [PRIVATE_KEY],
            },
            bsc: {
                chainId: 56,
                url: RPC_URL,
                accounts: [PRIVATE_KEY],
            },
            arbitrumOne: {
                chainId: 42161,
                url: RPC_URL,
                accounts: [PRIVATE_KEY],
            },
            base: {
                chainId: 8453,
                url: RPC_URL,
                accounts: [PRIVATE_KEY],
            },
            arbitrumTestnet: {
                chainId: 421611,
                url: RPC_URL,
                accounts: [PRIVATE_KEY],
            },
            hardhat: {
                forking: {
                    url: RPC_URL,
                    // blockNumber: 132401260
                },
                mining: {
                    auto: true,
                    interval: 200,
                }
            },
        },
        solidity: {
            compilers: [
                {
                    version: "0.8.28",
                    settings: {
                        optimizer: {
                            enabled: true,
                            runs: 200,
                        },
                    },
                }
            ]
        },
        abiExporter: [
            {
                runOnCompile: true,
                clear: true,
                path: './abi-exporter/general',
                format: "json"
            },
            {
                runOnCompile: true,
                clear: true,
                path: './abi-exporter/ethers',
                pretty: true
            }
        ],
        diamondAbi: {
            name: "DiamondCombined",
            include: ["Facet"],
            strict: true,
            filter: (() => {
                const ignoreFacets = ["Test1Facet", "Test2Facet"];

                const facetSet = new Set<string>();
                const facetFunctionMap = new Map<string, string>();
                const facetEventErrorSet = new Set<string>();
                return function (abiElement: any, index: number, fullAbi: any[], fullyQualifiedName: string) {
                    if (ignoreFacets.some(facet => fullyQualifiedName.endsWith(facet))) {
                        return false
                    }
                    // 1-filter events and errors
                    if (abiElement.type === "event" || abiElement.type === "error") {
                        const minimalAbi = Fragment.from(abiElement).format("minimal")
                        if (facetEventErrorSet.has(minimalAbi)) {
                            return false
                        }
                        facetEventErrorSet.add(minimalAbi)
                        return true;
                    }
                    // 2-filter functions
                    const selector = FunctionFragment.from(abiElement).selector
                    if (facetFunctionMap.has(selector)) {
                        throw new Error(`${FunctionFragment.from(abiElement).selector}, see:\n\t${Fragment.from(abiElement).format("minimal")}::${fullyQualifiedName}\n\t${facetFunctionMap.get(selector)}\n`)
                    }
                    facetFunctionMap.set(selector, `${Fragment.from(abiElement).format("minimal")}::${fullyQualifiedName}`)
                    // 3-print first facet
                    if (!facetSet.has(fullyQualifiedName)) {
                        facetSet.add(fullyQualifiedName)
                        console.log(` >>> [hardhat-diamond-abi] Combined! ${fullyQualifiedName}`)
                    }
                    return true;
                }
            })(),
        },
    }
;


export default config;
