import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export default function RsvpStructurePage() {
  const { role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<{
    tableStructure?: TableColumn[];
    policies?: any[];
    sampleRecords?: any[];
  }>({});
  const [testData, setTestData] = useState({
    asistencia: 'asistire',
    menu: 'Menú Test Manual',
    comentario: 'Test manual'
  });
  const [testResult, setTestResult] = useState<any>(null);

  // Redirigir si no es admin
  useEffect(() => {
    if (role !== 'admin' && role !== 'prometidos') {
      router.push('/login');
    }
  }, [role, router]);

  useEffect(() => {
    async function fetchTableInfo() {
      setLoading(true);
      try {
        const response = await fetch('/api/rsvp-structure');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener información de la tabla');
        }
        
        setTableInfo(data);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (role === 'admin' || role === 'prometidos') {
      fetchTableInfo();
    }
  }, [role]);

  async function createTestRecord() {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      const response = await fetch('/api/rsvp-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: testData,
          userId: user.id
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear registro de prueba');
      }
      
      setTestResult(result);
      
      // Recargar la información de la tabla
      const infoResponse = await fetch('/api/rsvp-structure');
      const infoData = await infoResponse.json();
      if (!infoResponse.ok) {
        throw new Error('Error al actualizar información de tabla');
      }
      setTableInfo(infoData);
      
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fixColumnTypes() {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Verificar si tiene permiso para ejecutar SQL directo (solo admin real)
      if (role !== 'admin') {
        setError('Solo los administradores pueden ejecutar este comando');
        setLoading(false);
        return;
      }
      
      // 2. Ejecutar SQL para corregir tipos de columnas
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          ALTER TABLE public.rsvp 
          ALTER COLUMN asistencia TYPE text,
          DROP CONSTRAINT IF EXISTS rsvp_asistencia_check,
          ADD CONSTRAINT rsvp_asistencia_check CHECK (asistencia IN ('asistire', 'no_puedo_ir'));
        `
      });
      
      if (sqlError) {
        throw sqlError;
      }
      
      // 3. Recargar información de la tabla
      const infoResponse = await fetch('/api/rsvp-structure');
      const infoData = await infoResponse.json();
      if (!infoResponse.ok) {
        throw new Error('Error al actualizar información de tabla');
      }
      setTableInfo(infoData);
      
      alert('Estructura de tabla corregida exitosamente');
      
    } catch (err: any) {
      console.error('Error al corregir tipos de columnas:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }
  
  if (role !== 'admin' && role !== 'prometidos') {
    return <div className="p-8">Redirigiendo a login...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Estructura de Tabla RSVP</h1>
      
      <div className="mb-6">
        <Link href="/admin/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Volver al Dashboard
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Cargando información...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Estructura de la Tabla</h2>
            
            {tableInfo.tableStructure && tableInfo.tableStructure.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="py-2 px-4 border">Columna</th>
                      <th className="py-2 px-4 border">Tipo</th>
                      <th className="py-2 px-4 border">Nullable</th>
                      <th className="py-2 px-4 border">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableInfo.tableStructure.map((col, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border font-medium">{col.column_name}</td>
                        <td className="py-2 px-4 border">{col.data_type}</td>
                        <td className="py-2 px-4 border">{col.is_nullable}</td>
                        <td className="py-2 px-4 border">{col.column_default || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-red-600">No se pudo obtener la estructura de la tabla</p>
            )}
            
            <div className="mt-4">
              <button
                onClick={fixColumnTypes}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                disabled={loading}
              >
                Corregir Tipos de Columna
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Datos de Muestra</h2>
            
            {tableInfo.sampleRecords && tableInfo.sampleRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="py-2 px-4 border">ID</th>
                      <th className="py-2 px-4 border">User ID</th>
                      <th className="py-2 px-4 border">Asistencia</th>
                      <th className="py-2 px-4 border">Menú</th>
                      <th className="py-2 px-4 border">Comentario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableInfo.sampleRecords.map((record, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border">{record.id}</td>
                        <td className="py-2 px-4 border">{record.user_id}</td>
                        <td className="py-2 px-4 border">{record.asistencia}</td>
                        <td className="py-2 px-4 border">{record.menu || '-'}</td>
                        <td className="py-2 px-4 border">{record.comentario || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-yellow-600">No hay registros en la tabla</p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Crear Registro de Prueba</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">Asistencia</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={testData.asistencia}
                  onChange={e => setTestData({...testData, asistencia: e.target.value})}
                >
                  <option value="asistire">asistire</option>
                  <option value="no_puedo_ir">no_puedo_ir</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Menú</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded"
                  value={testData.menu}
                  onChange={e => setTestData({...testData, menu: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Comentario</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded"
                  value={testData.comentario}
                  onChange={e => setTestData({...testData, comentario: e.target.value})}
                />
              </div>
            </div>
            
            <button
              onClick={createTestRecord}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Crear RSVP de Prueba'}
            </button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Resultado:</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
