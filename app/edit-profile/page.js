// pages/index.js

'use client'
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FormSkeleton } from '@/components/shared/Skeleton';

export const dynamic = 'force-dynamic';
const Form = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    college: '',
    city: '',
    country: '',
    phone: '',
    image: '',
  });

  const [imagePreview, setImagePreview] = useState(null);

  async function fetchUserInfo() {
    try {
      const response = await axios.get("/cognicode/api/getUserInfo");
      const data = response.data;
      setFormData(prev => ({ ...prev, ...data }));
      if (data.image) {
        setImagePreview(data.image);
      }
    } catch (error) {
      // silently fail — form still works
    }
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/cognicode/api/profileUpdate', formData);
      router.push('/profile');
    } catch (error) {
      if (error.response) {
        console.error("Server responded with error:", error.response.data);
        setError(error.response.data.message || 'An error occurred.');
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError('No response received from the server.');
      } else {
        console.error("Request setup error:", error.message);
        setError('Error setting up the request.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
      {/* Profile Photo Upload */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-red-500 bg-light-3 dark:bg-dark-4 flex items-center justify-center shadow-lg">
          {imagePreview ? (
            <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <span className="text-4xl font-bold">{formData.name ? formData.name.charAt(0).toUpperCase() : '?'}</span>
            </div>
          )}
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
            CHANGE
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Profile Picture</p>
      </div>

      <input
        type="text"
        name="name"
        id="name"
        placeholder='Full Name'
        value={formData.name}
        onChange={handleChange}
        className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />
      <div className="flex justify-between gap-3">
        <input
          type="number"
          name="age"
          id="age"
          placeholder='Age'
          value={formData.age}
          onChange={handleChange}
          className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
        <select
          name="gender"
          id="gender"
          value={formData.gender}
          onChange={handleChange}
          className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>
      <input
        type="tel"
        name="phone"
        id="phone"
        placeholder='Phone'
        value={formData.phone}
        onChange={handleChange}
        className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />
      <input
        type="text"
        name="college"
        id="college"
        placeholder='Institute Name'
        value={formData.college}
        onChange={handleChange}
        className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />
      <input
        type="text"
        name="city"
        id="city"
        placeholder='City'
        value={formData.city}
        onChange={handleChange}
        className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />
      <input
        type="text"
        name="country"
        id="country"
        placeholder='Country'
        value={formData.country}
        onChange={handleChange}
        className="shadow-md p-4 bg-light-2 dark:bg-dark-3 dark:text-light-1 dark:border dark:border-dark-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />

      {error && (
        <div className="text-center bg-accent py-2 px-6 text-white rounded-full cursor-pointer" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="mb-4 bg-red-600 hover:bg-red-700 text-center text-white px-4 py-2 rounded-xl disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        disabled={formData.age === '' || formData.city === '' || formData.college === '' || formData.country === '' || formData.gender === '' || formData.name === '' || formData.phone === '' || isLoading}
      >
        {isLoading ? (
          <img src="/cognicode/loader.svg" alt="loading" className="w-6 h-6 object-contain mx-auto" />
        ) : "Update"}
      </button>

    </form>
  );
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status]);

  if (status === 'loading') return <FormSkeleton />;
  if (!session) return null;

  return (
    <div className="flex items-center justify-center mt-8 px-2">
      <div className="max-w-lg w-full">
        <Link href="/profile" className='text-gray-1 dark:text-gray-2 hover:text-red-500 transition-colors'>⯇ Back</Link>
        <h1 className="text-2xl font-bold my-4 dark:text-light-1">Update Profile</h1>
        <div className="h-1 w-10 bg-red-500 rounded-full mb-4"></div>
        <Form />
      </div>
    </div>
  );
}