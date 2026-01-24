'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ProfileEditForm from '@/components/features/profile/ProfileEditForm';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Profile Page
 * Displays user information and allows editing
 */
export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-red-50 p-6">
            <p className="text-sm text-red-800">{error}</p>
            <Button
              onClick={fetchProfile}
              className="mt-4 w-full"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Profile
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account information
          </p>
        </div>

        {isEditing ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Edit Profile
              </h2>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
            <ProfileEditForm
              currentUser={user}
              onSuccess={handleProfileUpdated}
            />
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Account Information
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your personal details and settings
                </p>
              </div>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>

            <dl className="space-y-6">
              {/* Name */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>

              {/* Email */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-gray-900">{user.email}</span>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Not Verified
                    </span>
                  )}
                </dd>
                {!user.emailVerified && (
                  <p className="mt-1 text-sm text-yellow-600">
                    Please check your email to verify your account
                  </p>
                )}
              </div>

              {/* Account Type */}
              {user.isAdmin && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Account Type
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Administrator
                    </span>
                  </dd>
                </div>
              )}

              {/* Member Since */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Member Since
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
