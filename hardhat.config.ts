import {HardhatUserConfig} from "hardhat/config";
import {Fragment, FunctionFragment} from "ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "hardhat-ignore-warnings";
import "hardhat-diamond-abi";
import "dotenv/config";

const config: HardhatUserConfig = {
    // warnings: {
    //     'contracts/legacy/**/*': {
    //         default: 'warn',
    //     },
    // },
    networks: {
        hardhat: {
            mining: {
                interval: 50
            }
            // forking: {
            //   url: "https://arbitrum.public-rpc.com",
            //   // blockNumber: 132401260
            // }
        },
        // refresh: `sol networks`
        "bsc": {
            "chainId": 56,
            "url": "https://bsc-dataseed1.bnbchain.org"
        },
        "arbitrumOne": {
            "chainId": 42161,
            "url": "https://arb-pokt.nodies.app"
        },
    },
    etherscan: {
        apiKey: ""
    },
    solidity: {
        compilers: [
            {
                version: "0.8.24",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    // viaIR: true
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
            const ignoreFacets = ["Test1Facet", "Test2Facet"]

            const facetSet = new Set<string>()
            const facetFunctionMap = new Map<string, string>()
            const facetEventErrorSet = new Set<string>()
            return function diamondFilterFunc(abiElement: any, index: number, fullAbi: any[], fullyQualifiedName: string) {
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
};


export default config;
