import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NegotiationSetupProps {
  onSetupComplete: () => void;
}

export function NegotiationSetup({ onSetupComplete }: NegotiationSetupProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [setupStatus, setSetupStatus] = useState<{
    checked: boolean;
    tablesExist: {
      negotiation_communications: boolean;
      sku_negotiation_history: boolean;
    } | null;
  }>({
    checked: false,
    tablesExist: null
  });

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/setup-negotiation-db', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSetupStatus({
          checked: true,
          tablesExist: data.tables
        });
        
        // If both tables exist, automatically complete setup
        if (data.tables.negotiation_communications && data.tables.sku_negotiation_history) {
          toast.success('Negotiation system is properly set up!');
          onSetupComplete();
        }
      } else {
        throw new Error('Failed to check database status');
      }
    } catch (error) {
      console.error('Error checking database:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsChecking(false);
    }
  };

  const createTables = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/setup-negotiation-db', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Database tables created successfully!');
        setSetupStatus({
          checked: true,
          tablesExist: {
            negotiation_communications: true,
            sku_negotiation_history: true
          }
        });
        onSetupComplete();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tables');
      }
    } catch (error) {
      console.error('Error creating tables:', error);
      toast.error('Failed to create database tables');
    } finally {
      setIsCreating(false);
    }
  };

  const allTablesExist = setupStatus.tablesExist?.negotiation_communications && 
                        setupStatus.tablesExist?.sku_negotiation_history;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Negotiation System Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The negotiation system requires database tables that may not be set up yet. 
            Please check the database status and set up the required tables.
          </AlertDescription>
        </Alert>

        {!setupStatus.checked && (
          <Button 
            onClick={checkDatabaseStatus} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Database...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Check Database Status
              </>
            )}
          </Button>
        )}

        {setupStatus.checked && setupStatus.tablesExist && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Database Status:</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">negotiation_communications</span>
                {setupStatus.tablesExist.negotiation_communications ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">sku_negotiation_history</span>
                {setupStatus.tablesExist.sku_negotiation_history ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            {!allTablesExist && (
              <Button 
                onClick={createTables}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Tables...
                  </>
                ) : (
                  'Create Missing Tables'
                )}
              </Button>
            )}

            {allTablesExist && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All required tables exist! The negotiation system is ready to use.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
