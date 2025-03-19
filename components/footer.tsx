import { siteConfig } from "@/config/site"
import Image from 'next/image'

export default function Footer() {
  return (
    <footer>
      <div className="container mx-auto w-full p-4 md:py-8">
    
        <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8" />
        <span className="block text-sm text-gray-500 sm:text-center">
          © 2025{" "}
          <a href="" className="hover:underline">
            {siteConfig.name}
          </a>
          . All Rights Reserved.
        </span>
      </div>
    </footer>
  )
}
