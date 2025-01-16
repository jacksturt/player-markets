/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tradetalk.json`.
 */
export type Tradetalk = {
  address: "7NBgMSauN6xquUkLFpqW6eaipf7vthZvbfCF7cjGwhPZ";
  metadata: {
    name: "tradetalk";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "faucetQuote";
      discriminator: [191, 38, 44, 66, 27, 132, 255, 23];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "quoteTokenMint";
          writable: true;
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [113, 117, 111, 116, 101, 67, 111, 110, 102, 105, 103];
              }
            ];
          };
        },
        {
          name: "destination";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "quoteTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "quantity";
          type: "u64";
        }
      ];
    },
    {
      name: "initMint";
      discriminator: [126, 176, 233, 16, 66, 117, 209, 125];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "quoteTokenMint";
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "config";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "quoteTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
              {
                kind: "arg";
                path: "playerId";
              },
              {
                kind: "arg";
                path: "timestamp";
              }
            ];
          };
        },
        {
          name: "playerTokenMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116];
              },
              {
                kind: "arg";
                path: "playerId";
              },
              {
                kind: "arg";
                path: "timestamp";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "playerId";
          type: "string";
        },
        {
          name: "timestamp";
          type: "string";
        }
      ];
    },
    {
      name: "initProjectionOracle";
      discriminator: [30, 220, 173, 27, 221, 99, 102, 178];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
              {
                kind: "arg";
                path: "playerId";
              },
              {
                kind: "arg";
                path: "timestamp";
              }
            ];
          };
        },
        {
          name: "playerStats";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ];
              },
              {
                kind: "arg";
                path: "playerId";
              },
              {
                kind: "arg";
                path: "timestamp";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "playerId";
          type: "string";
        },
        {
          name: "timestamp";
          type: "string";
        }
      ];
    },
    {
      name: "initQuote";
      discriminator: [62, 17, 99, 29, 5, 202, 144, 237];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "quoteTokenMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [113, 117, 111, 116, 101];
              }
            ];
          };
        },
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [113, 117, 111, 116, 101, 67, 111, 110, 102, 105, 103];
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [];
    },
    {
      name: "mintTokens";
      discriminator: [59, 132, 24, 246, 122, 39, 8, 243];
      accounts: [
        {
          name: "playerTokenMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116];
              },
              {
                kind: "account";
                path: "config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "playerStats";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ];
              },
              {
                kind: "account";
                path: "config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
              {
                kind: "account";
                path: "config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "destination";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "playerTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "payerAtaQuote";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "quoteTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "quoteTokenMint";
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "config";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "quoteTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "mintRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 95, 114, 101, 99, 111, 114, 100];
              },
              {
                kind: "account";
                path: "config";
              },
              {
                kind: "account";
                path: "payer";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "quantity";
          type: "u64";
        }
      ];
    },
    {
      name: "payout";
      discriminator: [149, 140, 194, 236, 174, 189, 6, 239];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "quoteTokenMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [113, 117, 111, 116, 101];
              }
            ];
          };
        },
        {
          name: "payerQuoteTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "quoteTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "playerTokenMint";
          writable: true;
        },
        {
          name: "payerPlayerTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "playerTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "mintConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
              {
                kind: "account";
                path: "mint_config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "mint_config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "mintConfig";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "quoteTokenMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "playerStats";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ];
              },
              {
                kind: "account";
                path: "mint_config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "mint_config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "mintRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 95, 114, 101, 99, 111, 114, 100];
              },
              {
                kind: "account";
                path: "mintConfig";
              },
              {
                kind: "account";
                path: "payer";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [];
    },
    {
      name: "updateProjectionOracle";
      discriminator: [214, 174, 5, 108, 207, 23, 183, 49];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
              {
                kind: "account";
                path: "config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "playerStats";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ];
              },
              {
                kind: "account";
                path: "config.player_id";
                account: "playerMintConfig";
              },
              {
                kind: "account";
                path: "config.timestamp";
                account: "playerMintConfig";
              }
            ];
          };
        },
        {
          name: "authority";
          signer: true;
        }
      ];
      args: [
        {
          name: "projectedPoints";
          type: "f64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "mintRecord";
      discriminator: [47, 252, 142, 126, 241, 162, 116, 188];
    },
    {
      name: "playerMintConfig";
      discriminator: [202, 254, 4, 217, 136, 187, 8, 176];
    },
    {
      name: "playerStats";
      discriminator: [169, 146, 242, 176, 102, 118, 231, 172];
    },
    {
      name: "quoteMintConfig";
      discriminator: [191, 117, 233, 144, 194, 237, 184, 166];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "defaultError";
      msg: "defaultError";
    },
    {
      code: 6001;
      name: "unauthorizedUpdate";
      msg: "Unauthorized update.";
    },
    {
      code: 6002;
      name: "unauthorizedAuthority";
      msg: "Unauthorized authority.";
    }
  ];
  types: [
    {
      name: "mintRecord";
      type: {
        kind: "struct";
        fields: [
          {
            name: "depositedAmount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "playerMintConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "configBump";
            type: "u8";
          },
          {
            name: "playerTokenBump";
            type: "u8";
          },
          {
            name: "totalDepositedAmount";
            type: "u64";
          },
          {
            name: "quoteTokenMint";
            type: "pubkey";
          },
          {
            name: "playerTokenMint";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "string";
          },
          {
            name: "playerId";
            type: "string";
          }
        ];
      };
    },
    {
      name: "playerStats";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "projectedPoints";
            type: "f64";
          },
          {
            name: "lastUpdated";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "quoteMintConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "configBump";
            type: "u8";
          },
          {
            name: "quoteTokenBump";
            type: "u8";
          }
        ];
      };
    }
  ];
};
