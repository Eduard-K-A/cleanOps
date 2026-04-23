'use client';

import { useState } from 'react';
import { 
  Smartphone, 
  Building2, 
  ChevronRight, 
  Shield, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addMoney, withdrawMoney } from '@/app/actions/payments';
import toast from 'react-hot-toast';

export type SimulationStep = 'SELECT_METHOD' | 'ENTRY_DETAILS' | 'VERIFICATION' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank' | 'wallet';
  icon: React.ReactNode;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { 
    id: 'gcash', 
    name: 'GCash', 
    type: 'wallet', 
    icon: <Smartphone className="w-5 h-5" />, 
    color: 'bg-blue-600' 
  },
  { 
    id: 'maya', 
    name: 'Maya', 
    type: 'wallet', 
    icon: <Smartphone className="w-5 h-5" />, 
    color: 'bg-emerald-500' 
  },
  { 
    id: 'bdo', 
    name: 'BDO Unibank', 
    type: 'bank', 
    icon: <Building2 className="w-5 h-5" />, 
    color: 'bg-blue-800' 
  },
  { 
    id: 'bpi', 
    name: 'BPI', 
    type: 'bank', 
    icon: <Building2 className="w-5 h-5" />, 
    color: 'bg-red-700' 
  },
];

interface PaymentSimulationProps {
  type: TransactionType;
  currentBalance: number;
  onSuccess: (amount: number, methodName: string) => void;
  onCancel: () => void;
}

export function PaymentSimulation({ type, currentBalance, onSuccess, onCancel }: PaymentSimulationProps) {
  const [step, setStep] = useState<SimulationStep>('SELECT_METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('ENTRY_DETAILS');
  };

  const handleProcessTransaction = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero');
      return;
    }

    if (type === 'WITHDRAWAL' && Number(amount) > currentBalance) {
      setErrorMessage('Insufficient balance');
      return;
    }

    setStep('VERIFICATION');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setErrorMessage('Please enter a 6-digit verification code');
      return;
    }

    setStep('PROCESSING');
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const numAmount = Number(amount);
      if (type === 'DEPOSIT') {
        await addMoney(numAmount);
      } else {
        await withdrawMoney(numAmount);
      }
      
      setStep('SUCCESS');
      onSuccess(numAmount, selectedMethod?.name || '');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Transaction failed');
      setStep('FAILURE');
    }
  };

  switch (step) {
    case 'SELECT_METHOD':
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">
            Select your preferred {type === 'DEPOSIT' ? 'payment' : 'withdrawal'} method
          </p>
          <div className="grid grid-cols-1 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => handleSelectMethod(method)}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center text-white shadow-sm`}>
                    {method.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{method.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{method.type}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={onCancel} className="w-full text-slate-500">Cancel</Button>
        </div>
      );

    case 'ENTRY_DETAILS':
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className={`w-8 h-8 rounded-full ${selectedMethod?.color} flex items-center justify-center text-white text-xs`}>
              {selectedMethod?.icon}
            </div>
            <p className="text-sm font-medium text-slate-700">{selectedMethod?.name}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-slate-700 mb-1.5 block">Amount to {type === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} (USD)</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</div>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="account" className="text-slate-700 mb-1.5 block">
                {selectedMethod?.type === 'wallet' ? 'Mobile Number' : 'Account Number'}
              </Label>
              <Input
                id="account"
                placeholder={selectedMethod?.type === 'wallet' ? '09XXXXXXXXX' : 'XXXX-XXXX-XXXX'}
                className="font-mono"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <Button onClick={handleProcessTransaction} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              Continue to Verification
            </Button>
            <Button variant="ghost" onClick={() => setStep('SELECT_METHOD')} className="w-full text-slate-500">Back</Button>
          </div>
        </div>
      );

    case 'VERIFICATION':
      return (
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Verification Required</h4>
            <p className="text-sm text-slate-500 mt-1">
              We've sent a 6-digit code to your registered mobile number for {selectedMethod?.name}.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-48 text-center text-2xl tracking-[0.5em] font-bold h-14"
                placeholder="000000"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <Button onClick={handleVerifyOtp} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              Verify & Complete
            </Button>
            <p className="text-xs text-slate-400">
              Didn't receive the code? <button className="text-blue-600 hover:underline">Resend</button>
            </p>
          </div>
        </div>
      );

    case 'PROCESSING':
      return (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Processing Transaction</p>
            <p className="text-sm text-slate-500">Securely communicating with {selectedMethod?.name}...</p>
          </div>
        </div>
      );

    case 'SUCCESS':
      return (
        <div className="py-6 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto scale-110 animate-in zoom-in duration-300">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-slate-800">Success!</h4>
            <p className="text-slate-500 mt-2">
              Your {type.toLowerCase()} of <span className="font-bold text-slate-800">{formatCurrency(Number(amount))}</span> via {selectedMethod?.name} has been processed successfully.
            </p>
          </div>
          
          <Button onClick={onCancel} className="w-full bg-slate-900 hover:bg-slate-800 h-11">
            Close
          </Button>
        </div>
      );

    case 'FAILURE':
      return (
        <div className="py-6 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-slate-800">Transaction Failed</h4>
            <p className="text-slate-500 mt-2">
              {errorMessage || 'Something went wrong while processing your request.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('SELECT_METHOD')} className="flex-1">Try Again</Button>
            <Button onClick={onCancel} className="flex-1 bg-slate-900">Close</Button>
          </div>
        </div>
      );
    default:
      return null;
  }
}
