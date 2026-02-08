import Link from 'next/link'
import React from 'react'
import { authOptions } from "@/app/api/auth/[...nextauth]/route.js"
import { getServerSession } from "next-auth/next"
import NavLinks from './NavLinks'
import Image from 'next/image'
import NavMenu from './NavMenu'

const Navbar = async () => {

  let session = null;
  let userID = null;

  try {
    session = await getServerSession(authOptions);
    userID = session?.user?._id;
  } catch (error) {
    // Handle JWT decryption errors (old session cookies with different secret)
    // Suppress the error logging as it's expected when secrets change
    if (error.name !== 'JWEDecryptionFailed') {
      console.error('Session error:', error);
    }
    // session and userID remain null, user will see login options
  }

  return (
    <div className='w-full bg-light-1'>

      <div className='max-w-6xl mx-auto flex justify-between items-center px-2 py-6'>

        <Link href='/' className='flex justify-center items-center gap-3 '>
          <img
            src='/coding.png'
            alt='cognicode_logo'
            className='w-8 h-8 object-contain'
          />
          <h2 className='font-bold text-2xl'>
            COGNICODE
          </h2>
        </Link>

        <NavLinks user={userID} />

        <div className='flex items-center gap-3'>

          <button className='w-10 h-10 max-sm:w-8 max-sm:h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors'>
            <img
              src='/dark-mode.png'
              alt='theme toggle'
              className='w-10 h-10 object-contain'
            />
          </button>

          <Link href={userID ? '/profile' : '/login'}>
            <img
              src='/profile.png'
              alt='profile'
              className='w-10 h-10 max-sm:w-8 max-sm:h-8 object-contain'
            />
          </Link>

          <NavMenu user={userID} />
        </div>
      </div>


    </div>
  )
}

export default Navbar