'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 

  Heart, 
  Brain, 
  Zap, 
  Briefcase, 
  Scale, 
  AlertTriangle, 
  Target, 
  Moon,
  Save, 
  ArrowLeft
} from 'lucide-react'; // Assuming these are used for icons
import { useUser } from '@/hooks/use-user'; // Correct import for useUser
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Import db
import Link from 'next/link';

interface ReportData {
  stress_level: number;
  mood_rating: number;
  energy_level: number;
  work_satisfaction: number;
  work_life_balance: number;
  anxiety_level: number;
  confidence_level: number;
  sleep_quality: number;
  comments: string;
  timestamp: Date; // Add timestamp to the type
  employee_id: string; // Add employee_id to the type
}

export default function NewReportPage() {
  const router = useRouter();
  // Removed Supabase client initialization
  const { user } = useUser(); // Get the user object from the hook

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [reportData, setReportData] = useState<ReportData>({
    stress_level: 5,
    mood_rating: 5,
    energy_level: 5,
    work_satisfaction: 5,
    work_life_balance: 5,
    anxiety_level: 5,
    confidence_level: 5,
    sleep_quality: 5,
    timestamp: new Date(), // Initialize timestamp
    comments: '', 
    employee_id: user?.id || '', // Initialize employee_id with user ID
  });

  const totalSteps = 4;

  const updateMetric = (key: keyof ReportData, value: number | string) => {
    setReportData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const reportToSave: ReportData = {
      ...reportData,
      timestamp: new Date(), // Use serverTimestamp() if running on server/functions - keeping New Date for now
      employee_id: user?.id || '', // Ensure employee_id is set before saving
    };

    try {
      // Assuming 'db' is imported from '@/lib/firebase'
      await addDoc(collection(db, 'mentalHealthReports'), reportToSave);

      // No specific error check needed for addDoc success, caught by the catch block

      // toast.success('Wellness report saved successfully!'); // Re-add toast if needed
      router.push('/employee/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Emotional Wellbeing';
      case 2: return 'Work & Life Balance';
      case 3: return 'Physical & Mental State';
      case 4: return 'Additional Notes';
      default: return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Heart className="h-6 w-6 text-red-500" />
                <Label className="text-lg font-medium">How is your mood today?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.mood_rating]}
                  onValueChange={(value) => updateMetric('mood_rating', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Very Low (1)</span>
                  <span className="font-medium text-lg">{reportData.mood_rating}/10</span>
                  <span>Excellent (10)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <Label className="text-lg font-medium">What's your stress level?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.stress_level]}
                  onValueChange={(value) => updateMetric('stress_level', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>No Stress (1)</span>
                  <span className="font-medium text-lg">{reportData.stress_level}/10</span>
                  <span>Very High (10)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-purple-500" />
                <Label className="text-lg font-medium">How anxious do you feel?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.anxiety_level]}
                  onValueChange={(value) => updateMetric('anxiety_level', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Very Calm (1)</span>
                  <span className="font-medium text-lg">{reportData.anxiety_level}/10</span>
                  <span>Very Anxious (10)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-6 w-6 text-blue-500" />
                <Label className="text-lg font-medium">How satisfied are you with your work?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.work_satisfaction]}
                  onValueChange={(value) => updateMetric('work_satisfaction', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Very Unsatisfied (1)</span>
                  <span className="font-medium text-lg">{reportData.work_satisfaction}/10</span>
                  <span>Very Satisfied (10)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Scale className="h-6 w-6 text-green-500" />
                <Label className="text-lg font-medium">How's your work-life balance?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.work_life_balance]}
                  onValueChange={(value) => updateMetric('work_life_balance', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Very Poor (1)</span>
                  <span className="font-medium text-lg">{reportData.work_life_balance}/10</span>
                  <span>Excellent (10)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-yellow-500" />
                <Label className="text-lg font-medium">What's your energy level?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.energy_level]}
                  onValueChange={(value) => updateMetric('energy_level', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Exhausted (1)</span>
                  <span className="font-medium text-lg">{reportData.energy_level}/10</span>
                  <span>Very Energetic (10)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6 text-indigo-500" />
                <Label className="text-lg font-medium">How confident do you feel?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.confidence_level]}
                  onValueChange={(value) => updateMetric('confidence_level', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Very Low (1)</span>
                  <span className="font-medium text-lg">{reportData.confidence_level}/10</span>
                  <span>Very Confident (10)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Moon className="h-6 w-6 text-gray-500" />
                <Label className="text-lg font-medium">How was your sleep quality?</Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[reportData.sleep_quality]}
                  onValueChange={(value) => updateMetric('sleep_quality', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Very Poor (1)</span>
                  <span className="font-medium text-lg">{reportData.sleep_quality}/10</span>
                  <span>Excellent (10)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">
                Additional thoughts or comments (optional)
              </Label>
              <Textarea
                placeholder="Share any additional thoughts about your mental health, recent events, or anything else you'd like to note..."
                value={reportData.comments}
                onChange={(e) => updateMetric('comments', e.target.value)}
                rows={6}
                className="w-full"
              />
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">Report Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Mood: {reportData.mood_rating}/10</div>
                <div>Stress: {reportData.stress_level}/10</div>
                <div>Energy: {reportData.energy_level}/10</div>
                <div>Work Satisfaction: {reportData.work_satisfaction}/10</div>
                <div>Work-Life Balance: {reportData.work_life_balance}/10</div>
                <div>Anxiety: {reportData.anxiety_level}/10</div>
                <div>Confidence: {reportData.confidence_level}/10</div>
                <div>Sleep Quality: {reportData.sleep_quality}/10</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to create a wellness report.</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/employee/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Wellness Report</h1>
          <p className="text-gray-600 mt-2">
            Take a moment to reflect on your current mental and emotional state.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{getStepTitle(currentStep)}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Report
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Privacy Notice:</strong> Your wellness data is encrypted and stored securely. 
            Only you can view your individual reports. Employers can only see anonymized, 
            aggregated data to understand overall team wellness trends.
          </p>
        </div>
      </div>
    </div>
  );
}