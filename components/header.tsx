import { MenuIcon } from "lucide-react"

import { useRouter } from "next/router"
import { IconButton } from "./ui/icon-button"
import { Typography } from "./ui/typography"
import ConnectWalletButton from "@/components/connect-wallet-button"


import { siteConfig } from "@/config/site"






export default function Header() {
  const { asPath } = useRouter()

  return (
    <header className="fixed left-0 top-0 z-20 w-full border-b border-gray-200 bg-white">
      <meta name="google-site-verification" content="UAi1LiF48Qyitx8jDdJti1usq0o0n3oHWkzMkhrEuwc" />
      <div className="container mx-auto flex items-center p-4 md:px-6">
        <a href="/" className="flex items-center">
          <img src="/assets/nest1.png" className="mr-3 h-20" alt={siteConfig.name} />
          <Typography as="span" level="h6" className="hidden whitespace-nowrap font-semibold md:inline-block">
            {siteConfig.name}
          </Typography>
        </a>

         <div className="flex flex-1 items-center justify-end gap-2">
          <ConnectWalletButton />
          <IconButton className="md:hidden">
            <MenuIcon />
          </IconButton>
        </div> 
      </div>
    </header>
  )
}
