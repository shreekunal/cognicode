import Link from 'next/link'
import React from 'react'
import { FiHome, FiBookOpen, FiCode } from 'react-icons/fi'

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className='min-h-[75vh] flex flex-col justify-center items-center px-4'>
      <div className="text-center">
        <h1 className='text-8xl font-bold text-red-500 mb-2'>404</h1>
        <p className='text-2xl font-semibold text-dark-1 dark:text-light-1 mb-2'>Page Not Found</p>
        <p className='text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto'>
          The page you're looking for doesn't exist or has been moved. Try one of the links below.
        </p>
        <div className='flex flex-wrap justify-center gap-3'>
          <Link href='/' className='flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl transition-colors font-medium'>
            <FiHome size={18} /> Home
          </Link>
          <Link href='/learn' className='flex items-center gap-2 bg-light-3 dark:bg-dark-4 hover:bg-light-4 dark:hover:bg-dark-3 text-dark-1 dark:text-light-1 py-3 px-6 rounded-xl transition-colors font-medium'>
            <FiBookOpen size={18} /> Learn
          </Link>
          <Link href='/problems' className='flex items-center gap-2 bg-light-3 dark:bg-dark-4 hover:bg-light-4 dark:hover:bg-dark-3 text-dark-1 dark:text-light-1 py-3 px-6 rounded-xl transition-colors font-medium'>
            <FiCode size={18} /> Problems
          </Link>
        </div>
      </div>
    </div>
  )
}