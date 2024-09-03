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
            mainnet: {
                chainId: 1,
                url: 'https://mainnet.gateway.tenderly.co'
            },
            bsc: {
                chainId: 56,
                url: 'https://bsc-dataseed1.bnbchain.org'
            },
            arbitrumOne: {
                chainId: 42161,
                url: 'https://rpc.ankr.com/arbitrum'
            },
            base: {
                chainId: 8453,
                url: 'https://base.gateway.tenderly.co'
            },
            avalanche: {
                chainId: 43114,
                url: 'https://rpc.ankr.com/avalanche'
            },
            polygon: {
                chainId: 137,
                url: 'https://polygon-rpc.com'
            },
            optimisticEthereum: {
                chainId: 10,
                url: 'https://rpc.ankr.com/optimism'
            },
            gnosis: {
                chainId: 100,
                url: 'https://rpc.ankr.com/gnosis'
            },
            opera: {
                chainId: 250,
                url: 'https://rpc.ankr.com/fantom'
            },
            moonbeam: {
                chainId: 1284,
                url: 'https://rpc.ankr.com/moonbeam'
            },
            aurora: {
                chainId: 1313161554,
                url: 'https://mainnet.aurora.dev'
            },
            moonriver: {
                chainId: 1285,
                url: 'https://moonriver.drpc.org'
            },
            harmony: {
                chainId: 1666600000,
                url: 'https://rpc.ankr.com/harmony'
            },
            goerli: {
                chainId: 5,
                url: 'https://eth-goerli.public.blastapi.io'
            },
            heco: {
                chainId: 128,
                url: 'https://http-mainnet.hecochain.com'
            },
            bscTestnet: {
                chainId: 97,
                url: 'https://endpoints.omniatech.io/v1/bsc/testnet/public'
            },
            sokol: {
                chainId: 77,
                url: 'https://sokol.poa.network'
            },
            hecoTestnet: {
                chainId: 256,
                url: 'https://http-testnet.hecochain.com'
            },
            optimisticGoerli: {
                chainId: 420,
                url: 'https://goerli.optimism.io'
            },
            moonbaseAlpha: {
                chainId: 1287,
                url: 'https://rpc.api.moonbase.moonbeam.network'
            },
            ftmTestnet: {
                chainId: 4002,
                url: 'https://rpc.testnet.fantom.network'
            },
            chiado: {
                chainId: 10200,
                url: 'https://rpc.chiadochain.net'
            },
            avalancheFujiTestnet: {
                chainId: 43113,
                url: 'https://rpc.ankr.com/avalanche_fuji'
            },
            polygonMumbai: {
                chainId: 80001,
                url: 'https://polygon-testnet.public.blastapi.io'
            },
            arbitrumTestnet: {
                chainId: 421611,
                url: 'https://rinkeby.arbitrum.io/rpc'
            },
            baseGoerli: {
                chainId: 84531,
                url: 'https://base-goerli.public.blastapi.io'
            },
            arbitrumGoerli: {
                chainId: 421613,
                url: 'https://goerli-rollup.arbitrum.io/rpc'
            },
            sepolia: {
                chainId: 11155111,
                url: 'https://endpoints.omniatech.io/v1/eth/sepolia/public'
            },
            auroraTestnet: {
                chainId: 1313161555,
                url: 'https://endpoints.omniatech.io/v1/aurora/testnet/public'
            },
            harmonyTest: {
                chainId: 1666700000,
                url: 'https://api.s0.b.hmny.io'
            }
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
