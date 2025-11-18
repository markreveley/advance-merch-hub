import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AutoImport() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Starting import...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const runImport = async () => {
      try {
        // Fetch the CSV file
        const response = await fetch('/assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv');
        const csvData = await response.text();

        setMessage('Processing CSV data via edge function...');

        // Call edge function
        const { data, error } = await supabase.functions.invoke('import-ambient-inks', {
          body: { csvData },
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Import completed successfully!');
        setDetails(data);
      } catch (error: any) {
        console.error('Import error:', error);
        setStatus('error');
        setMessage(`Import failed: ${error.message}`);
      }
    };

    runImport();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            Auto Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{message}</p>
          {details && (
            <div className="bg-muted p-4 rounded">
              <p>Products Imported: {details.productsImported}</p>
              <p>Variants Imported: {details.variantsImported}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
