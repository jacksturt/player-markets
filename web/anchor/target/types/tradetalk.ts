/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tradetalk.json`.
 */
export type Tradetalk = {
  address: "A13hqcQX4g2o57dW4vRQKem5G7YykugzPGyvda5YXijV";
  metadata: {
    name: "tradetalk";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "closeAccounts";
      discriminator: [171, 222, 94, 233, 34, 250, 202, 1];
      accounts: [
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "quoteTokenMint";
        },
        {
          name: "mintConfig";
          writable: true;
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
          optional: true;
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
      name: "closeMintConfig";
      discriminator: [159, 215, 54, 201, 63, 29, 17, 12];
      accounts: [
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "quoteTokenMint";
        },
        {
          name: "mintConfig";
          writable: true;
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
      name: "closeMintRecord";
      discriminator: [153, 193, 204, 204, 250, 193, 63, 133];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "mintRecord";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "closePlayerStats";
      discriminator: [133, 58, 195, 34, 177, 204, 146, 70];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "playerStats";
          writable: true;
          optional: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "emptyVault";
      discriminator: [211, 8, 157, 200, 61, 144, 68, 142];
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
          optional: true;
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
      name: "setIsMintEnabled";
      discriminator: [32, 216, 128, 169, 132, 227, 175, 85];
      accounts: [
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
          name: "authority";
          signer: true;
        }
      ];
      args: [
        {
          name: "isMintEnabled";
          type: "bool";
        }
      ];
    },
    {
      name: "setIsPayoutEnabled";
      discriminator: [223, 16, 3, 87, 197, 83, 169, 4];
      accounts: [
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
          name: "authority";
          signer: true;
        }
      ];
      args: [
        {
          name: "isPayoutEnabled";
          type: "bool";
        }
      ];
    },
    {
      name: "testMintRewardsOnly";
      discriminator: [138, 24, 220, 27, 88, 39, 141, 117];
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
          optional: true;
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
      name: "testPayoutPlayerTokens";
      discriminator: [212, 94, 167, 27, 111, 163, 250, 13];
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
          optional: true;
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
          name: "points";
          type: "f64";
        },
        {
          name: "isProjected";
          type: "bool";
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
    },
    {
      code: 6003;
      name: "mintingNotEnabled";
      msg: "Tokens can only be minted before the game starts.";
    },
    {
      code: 6004;
      name: "payoutNotEnabled";
      msg: "Payout can only happen after the game ends.";
    },
    {
      code: 6005;
      name: "adminOnlyUnlock";
      msg: "Admin can only lock and unlock minting/payout.";
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
          },
          {
            name: "mintedAmount";
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
            name: "mintingEnabled";
            type: "bool";
          },
          {
            name: "payoutEnabled";
            type: "bool";
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
            name: "actualPoints";
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
