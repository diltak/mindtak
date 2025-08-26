import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { action, callData } = await request.json();

    switch (action) {
      case 'initiate':
        return await initiateCall(callData);
      case 'accept':
        return await acceptCall(callData);
      case 'reject':
        return await rejectCall(callData);
      case 'end':
        return await endCall(callData);
      case 'update_status':
        return await updateCallStatus(callData);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Call API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function initiateCall(callData: any) {
  const { callerId, receiverId, callType = 'voice', metadata = {} } = callData;

  if (!callerId || !receiverId) {
    return NextResponse.json({ error: 'Caller and receiver IDs are required' }, { status: 400 });
  }

  try {
    // Create call record
    const callRef = await addDoc(collection(db, 'calls'), {
      callerId,
      receiverId,
      callType,
      status: 'initiating',
      startTime: serverTimestamp(),
      metadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create call session for real-time updates
    await setDoc(doc(db, 'callSessions', callRef.id), {
      callId: callRef.id,
      callerId,
      receiverId,
      status: 'initiating',
      participants: [callerId, receiverId],
      startTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      callId: callRef.id,
      message: 'Call initiated successfully'
    });
  } catch (error: any) {
    console.error('Error initiating call:', error);
    throw error;
  }
}

async function acceptCall(callData: any) {
  const { callId, receiverId } = callData;

  if (!callId || !receiverId) {
    return NextResponse.json({ error: 'Call ID and receiver ID are required' }, { status: 400 });
  }

  try {
    // Update call status
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: 'active',
      answeredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update call session
    const sessionRef = doc(db, 'callSessions', callId);
    await updateDoc(sessionRef, {
      status: 'active',
      answeredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Call accepted successfully'
    });
  } catch (error: any) {
    console.error('Error accepting call:', error);
    throw error;
  }
}

async function rejectCall(callData: any) {
  const { callId, receiverId, reason = 'rejected' } = callData;

  if (!callId || !receiverId) {
    return NextResponse.json({ error: 'Call ID and receiver ID are required' }, { status: 400 });
  }

  try {
    // Update call status
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: 'rejected',
      endTime: serverTimestamp(),
      endReason: reason,
      updatedAt: serverTimestamp()
    });

    // Update call session
    const sessionRef = doc(db, 'callSessions', callId);
    await updateDoc(sessionRef, {
      status: 'rejected',
      endTime: serverTimestamp(),
      endReason: reason,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Call rejected successfully'
    });
  } catch (error: any) {
    console.error('Error rejecting call:', error);
    throw error;
  }
}

async function endCall(callData: any) {
  const { callId, userId, reason = 'ended' } = callData;

  if (!callId || !userId) {
    return NextResponse.json({ error: 'Call ID and user ID are required' }, { status: 400 });
  }

  try {
    // Update call status
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: 'ended',
      endTime: serverTimestamp(),
      endReason: reason,
      endedBy: userId,
      updatedAt: serverTimestamp()
    });

    // Update call session
    const sessionRef = doc(db, 'callSessions', callId);
    await updateDoc(sessionRef, {
      status: 'ended',
      endTime: serverTimestamp(),
      endReason: reason,
      endedBy: userId,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Call ended successfully'
    });
  } catch (error: any) {
    console.error('Error ending call:', error);
    throw error;
  }
}

async function updateCallStatus(callData: any) {
  const { callId, status, metadata = {} } = callData;

  if (!callId || !status) {
    return NextResponse.json({ error: 'Call ID and status are required' }, { status: 400 });
  }

  try {
    // Update call session
    const sessionRef = doc(db, 'callSessions', callId);
    await updateDoc(sessionRef, {
      status,
      metadata,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Call status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating call status:', error);
    throw error;
  }
}

