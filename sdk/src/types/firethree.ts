export type Firethree = {
  version: '0.1.0'
  name: 'firethree'
  instructions: [
    {
      name: 'createProject'
      accounts: [
        {
          name: 'signer'
          isMut: true
          isSigner: true
        },
        {
          name: 'project'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'args'
          type: {
            defined: 'CreateProjectArgs'
          }
        }
      ]
    },
    {
      name: 'deleteProject'
      accounts: [
        {
          name: 'authority'
          isMut: true
          isSigner: true
        },
        {
          name: 'project'
          isMut: true
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'createVault'
      accounts: [
        {
          name: 'signer'
          isMut: true
          isSigner: true
        },
        {
          name: 'vault'
          isMut: true
          isSigner: false
        },
        {
          name: 'payerTokenMint'
          isMut: false
          isSigner: false
        },
        {
          name: 'tokenAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'triadSigner'
          isMut: false
          isSigner: true
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        },
        {
          name: 'tokenProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'args'
          type: {
            defined: 'CreateVaultArgs'
          }
        }
      ]
    },
    {
      name: 'deposit'
      accounts: [
        {
          name: 'signer'
          isMut: true
          isSigner: true
        },
        {
          name: 'vault'
          isMut: false
          isSigner: false
        },
        {
          name: 'depositor'
          isMut: true
          isSigner: false
        },
        {
          name: 'vaultTokenAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'userTokenAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        },
        {
          name: 'tokenProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'amount'
          type: 'u64'
        }
      ]
    },
    {
      name: 'createVaultDepositor'
      accounts: [
        {
          name: 'signer'
          isMut: true
          isSigner: true
        },
        {
          name: 'vault'
          isMut: false
          isSigner: false
        },
        {
          name: 'vaultDepositor'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: []
    }
  ]
  accounts: [
    {
      name: 'project'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'ts'
            type: 'i64'
          },
          {
            name: 'name'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'shdw'
            type: 'publicKey'
          },
          {
            name: 'authority'
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'vault'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'name'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'tokenAccount'
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'vaultDepositor'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'vault'
            type: 'publicKey'
          },
          {
            name: 'totalDeposit'
            type: 'u64'
          },
          {
            name: 'totalWithdrawal'
            type: 'u64'
          },
          {
            name: 'netDeposit'
            type: 'i64'
          },
          {
            name: 'lpShares'
            type: 'u64'
          }
        ]
      }
    }
  ]
  types: [
    {
      name: 'CreateProjectArgs'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'name'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'shdw'
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'CreateVaultArgs'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'name'
            type: {
              array: ['u8', 32]
            }
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 6000
      name: 'UnauthorizedToDeleteProject'
      msg: 'Unauthorized to delete the project'
    },
    {
      code: 6001
      name: 'InvalidShadowAccount'
      msg: 'Invalid shadow account'
    },
    {
      code: 6002
      name: 'InvalidAccount'
      msg: 'Invalid account'
    },
    {
      code: 6003
      name: 'Unauthorized'
      msg: 'Unauthorized access'
    },
    {
      code: 6004
      name: 'InvalidPassType'
      msg: 'Invalid pass type'
    },
    {
      code: 6005
      name: 'InvalidVaultDepositorAuthority'
      msg: 'Invalid vault depositor authority'
    },
    {
      code: 6006
      name: 'InvalidOwnerAuthority'
      msg: 'Invalid owner authority'
    },
    {
      code: 6007
      name: 'InvalidMintAddress'
      msg: 'Invalid mint address'
    }
  ]
}

export const IDL: Firethree = {
  version: '0.1.0',
  name: 'firethree',
  instructions: [
    {
      name: 'createProject',
      accounts: [
        {
          name: 'signer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'project',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'CreateProjectArgs'
          }
        }
      ]
    },
    {
      name: 'deleteProject',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true
        },
        {
          name: 'project',
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'createVault',
      accounts: [
        {
          name: 'signer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'vault',
          isMut: true,
          isSigner: false
        },
        {
          name: 'payerTokenMint',
          isMut: false,
          isSigner: false
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false
        },
        {
          name: 'triadSigner',
          isMut: false,
          isSigner: true
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'CreateVaultArgs'
          }
        }
      ]
    },
    {
      name: 'deposit',
      accounts: [
        {
          name: 'signer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'vault',
          isMut: false,
          isSigner: false
        },
        {
          name: 'depositor',
          isMut: true,
          isSigner: false
        },
        {
          name: 'vaultTokenAccount',
          isMut: true,
          isSigner: false
        },
        {
          name: 'userTokenAccount',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'amount',
          type: 'u64'
        }
      ]
    },
    {
      name: 'createVaultDepositor',
      accounts: [
        {
          name: 'signer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'vault',
          isMut: false,
          isSigner: false
        },
        {
          name: 'vaultDepositor',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: 'project',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'ts',
            type: 'i64'
          },
          {
            name: 'name',
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump',
            type: 'u8'
          },
          {
            name: 'shdw',
            type: 'publicKey'
          },
          {
            name: 'authority',
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'vault',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8'
          },
          {
            name: 'authority',
            type: 'publicKey'
          },
          {
            name: 'name',
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'tokenAccount',
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'vaultDepositor',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8'
          },
          {
            name: 'authority',
            type: 'publicKey'
          },
          {
            name: 'vault',
            type: 'publicKey'
          },
          {
            name: 'totalDeposit',
            type: 'u64'
          },
          {
            name: 'totalWithdrawal',
            type: 'u64'
          },
          {
            name: 'netDeposit',
            type: 'i64'
          },
          {
            name: 'lpShares',
            type: 'u64'
          }
        ]
      }
    }
  ],
  types: [
    {
      name: 'CreateProjectArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'name',
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'shdw',
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'CreateVaultArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'name',
            type: {
              array: ['u8', 32]
            }
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: 'UnauthorizedToDeleteProject',
      msg: 'Unauthorized to delete the project'
    },
    {
      code: 6001,
      name: 'InvalidShadowAccount',
      msg: 'Invalid shadow account'
    },
    {
      code: 6002,
      name: 'InvalidAccount',
      msg: 'Invalid account'
    },
    {
      code: 6003,
      name: 'Unauthorized',
      msg: 'Unauthorized access'
    },
    {
      code: 6004,
      name: 'InvalidPassType',
      msg: 'Invalid pass type'
    },
    {
      code: 6005,
      name: 'InvalidVaultDepositorAuthority',
      msg: 'Invalid vault depositor authority'
    },
    {
      code: 6006,
      name: 'InvalidOwnerAuthority',
      msg: 'Invalid owner authority'
    },
    {
      code: 6007,
      name: 'InvalidMintAddress',
      msg: 'Invalid mint address'
    }
  ]
}
