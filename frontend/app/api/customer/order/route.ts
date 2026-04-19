import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@/app/actions/jobs';
import { CreateJobRequest } from '@/types';

export async function POST(request: NextRequest) {
  console.log('API route /api/customer/order called');
  
  try {
    const body: CreateJobRequest = await request.json();
    console.log('Request body:', body);

    // Validate input
    if (!body.address || body.address.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid job address', code: 400 },
        { status: 400 }
      );
    }
    if (!body.tasks || body.tasks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one task is required', code: 400 },
        { status: 400 }
      );
    }
    if (typeof body.distance !== 'number' || isNaN(body.distance) || body.distance <= 0) {
      return NextResponse.json(
        { success: false, error: 'Estimated distance must be a valid number greater than 0', code: 400 },
        { status: 400 }
      );
    }
    if (!body.price_amount || body.price_amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price amount', code: 400 },
        { status: 400 }
      );
    }

    const jobData = {
      title: `Cleaning Job - ${body.tasks.map(t => t.name).join(', ')}`,
      tasks: body.tasks.map(t => t.name),
      urgency: body.urgency, // Keep original case (LOW, NORMAL, HIGH)
      address: body.address,
      distance: body.distance,
      price: body.price_amount,
      platformFee: Math.round(body.price_amount * 0.15),
    };

    console.log('Calling createJob with data:', jobData);
    const job = await createJob(jobData);
    console.log('Job created successfully:', job);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        job: job, 
        transactionId: (job as any)?.id || ''
      } 
    });  } catch (error: any) {
    console.error('API route error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create job', 
        code: 500,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
