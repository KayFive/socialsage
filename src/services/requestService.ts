// src/services/requestService.ts
// Improved version with better error handling and debugging

import { createBrowserClient } from '@/lib/supabase';

export interface CreateInstagramRequestData {
  user_id: string;
  instagram_handle: string;
  niche: string;
  goals: string[];
  email: string;
}

export const createInstagramRequest = async (data: CreateInstagramRequestData) => {
  const supabase = createBrowserClient();
  
  try {
    console.log('💾 Starting request creation with data:', data);
    
    // First, let's check if we can connect to the database
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('instagram_requests')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Insert the request
    console.log('📝 Inserting request into database...');
    const { data: result, error } = await supabase
      .from('instagram_requests')
      .insert({
        user_id: data.user_id,
        instagram_handle: data.instagram_handle,
        niche: data.niche,
        goals: data.goals,
        email: data.email,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database insert error:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to create request: ${error.message} (Code: ${error.code})`);
    }
    
    if (!result) {
      console.error('❌ No result returned from insert');
      throw new Error('Failed to create request: No data returned');
    }
    
    console.log('✅ Request created successfully:', result);
    
    // Verify the request was saved by trying to fetch it back immediately
    console.log('🔍 Verifying request was saved with ID:', result.id);
    const { data: verification, error: verifyError } = await supabase
      .from('instagram_requests')
      .select('*')
      .eq('id', result.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      console.error('❌ Verification error details:', {
        code: verifyError.code,
        message: verifyError.message,
        details: verifyError.details
      });
      throw new Error(`Request creation verification failed: ${verifyError.message}`);
    }
    
    if (!verification) {
      console.error('❌ Request not found after creation');
      throw new Error('Request was not properly saved to database');
    }
    
    console.log('✅ Request verification successful:', verification);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in createInstagramRequest:', error);
    
    // Additional debugging: Check if the table exists
    try {
      console.log('🔍 Checking if instagram_requests table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('instagram_requests')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Table check failed:', tableError);
        console.error('❌ This might mean the instagram_requests table does not exist or has permission issues');
      } else {
        console.log('✅ Table exists and is accessible');
      }
    } catch (tableCheckError) {
      console.error('❌ Table check threw error:', tableCheckError);
    }
    
    throw error;
  }
};