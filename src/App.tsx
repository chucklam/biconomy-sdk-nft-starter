import './App.css'
import "@biconomy/web3-auth/dist/src/style.css"
import { useState, useEffect, useRef } from 'react'
import SocialLogin from "@biconomy/web3-auth"
import { ChainId } from "@biconomy/core-types";
import { ethers } from 'ethers'
import SmartAccount from "@biconomy/smart-account";
import Minter from './components/Minter';
import { Box, AppBar, Toolbar, IconButton, Typography, Button, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

export default function App() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [provider, setProvider] = useState<any>(null);
  const [acct, setAcct] = useState<any>(null);
  const [profileImage, setProfileImage] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmIbLlFK9l2nG67nwVI0-k4hOiHw9eIwso3dP3J71ojWVGAVOb43f33KXiTmIeb0oK1Ck&usqp=CAU'
  );
  const [userName, setUserName] = useState('');
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  useEffect(() => {
    let configureLogin:any
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
  }, [interval])

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin()
      const signature1 = await socialLoginSDK.whitelistUrl('http://localhost:5173/')
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
        network: "testnet",
        whitelistUrls: {
          'http://localhost:5173/': signature1,
        }
      })
      sdkRef.current = socialLoginSDK
    }
    if (!sdkRef.current.provider) {
      sdkRef.current.showWallet()
      enableInterval(true)
    } else {
      setupSmartAccount()
    }
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) return
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    setProvider(web3Provider)
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworksIds: [ChainId.POLYGON_MUMBAI],
        networkConfig: [
          {
            chainId: ChainId.POLYGON_MUMBAI,
            dappAPIKey: import.meta.env.VITE_BICONOMY_API_KEY,
          },
        ],
      })
      const acct = await smartAccount.init()
      setAcct(acct)
      setSmartAccount(smartAccount)
      setLoading(false)
      
      const userInfo = await sdkRef.current?.getUserInfo();
      console.log(userInfo);
      if (userInfo?.profileImage) {
        setProfileImage(userInfo.profileImage);
      }
      if (userInfo?.name) {
        setUserName(userInfo.name);
      }
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
  }

  const logout = async () => {
    if (!sdkRef.current) {
      console.error('Web3Modal not initialized.')
      return
    }
    await sdkRef.current.logout()
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }

  console.log({ acct , provider})

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => setAnchorElUser(null);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} textAlign='left'>
            Social Login & Gasless NFT Minting
          </Typography>
          {
            !!smartAccount
            ?
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt="Remy Sharp" src={profileImage} />
                  </IconButton>
                </Tooltip>
                {
                  !!anchorElUser &&
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {settings.map((setting) => (
                      <MenuItem key={setting} onClick={logout}>
                        <Typography textAlign="center">{setting}</Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                }
              </Box>
            : !loading && <Button color="inherit" onClick={login}>Login</Button>
          }
        </Toolbar>
      </AppBar>
      {
        loading && <p>Loading account details...</p>
      }
      {
        !loading && (!!smartAccount
        ?
          <>
          <h3>Hi {userName}. Your smart account address is {smartAccount.address}</h3>
          <Minter smartAccount={smartAccount} provider={provider} acct={acct} />
          </>
        :
          <>
          <h1>Login to start minting NFTs</h1>
          <Button onClick={login}>Login</Button>
          </>
        )
      }
    </Box>
  )
}


