import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/AuthContext';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';

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
  const [rlsPolicies, setRlsPolicies] = useState<any[]>([]);
  const [rlsError, setRlsError] = useState<string | null>(null);

  // Redirigir si no es admin
  useEffect(() => {
    if (role !== 'admin' && role !== 'prometidos') {
      router.push('/login');
    }
  }, [role, router]);

  useEffect(() => {
    if (role === 'admin' || role === 'prometidos') {
      fetchTableInfo();
      fetchRlsPolicies();
    }
  }, [role]);

  // Función para obtener información de la tabla
  async function fetchTableInfo() {
    setLoading(true);
    try {
      const response = await fetch('/api/rsvp-structure');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error en API: ${response.status}`);
      }
      
      const data = await response.json();
      setTableInfo(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Función para obtener políticas RLS
  async function fetchRlsPolicies() {
    try {
      const response = await fetch('/api/rls-policies');
      const data = await response.json();
      
      if (!response.ok) {
        setRlsError(data.error || 'Error obteniendo políticas RLS');
        return;
      }
      
      setRlsPolicies(data.policies || []);
    } catch (err: any) {
      console.error('Error obteniendo políticas RLS:', err);
      setRlsError(err.message);
    }
  }

  async function createTestRecord() {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      console.log('Enviando datos de prueba:', {
        data: testData,
        userId: user.id
      });
      
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
      
      // Obtener la respuesta como texto para poder depurar
      let responseText;
      try {
        responseText = await response.text();
        console.log('Respuesta del servidor:', responseText);
      } catch (e) {
        responseText = 'No se pudo leer la respuesta';
        console.error('Error leyendo respuesta:', e);
      }
      
      // Intentar parsear como JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError);
        throw new Error(`Error al parsear respuesta: ${responseText}`);
      }
      
      if (!response.ok) {
        const errorMessage = result.error || result.message || 'Error al crear registro de prueba';
        const errorDetails = result.details ? JSON.stringify(result.details) : '';
        throw new Error(`${errorMessage}${errorDetails ? ' - ' + errorDetails : ''}`);
      }
      
      setTestResult(result);
      
      // Recargar la información de la tabla
      await fetchTableInfo();
      
    } catch (err: any) {
      console.error('Error al crear RSVP de prueba:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function fixTableStructure() {
    setLoading(true);
    setError(null);
    
    try {
      // Ejecutar SQL para corregir tipos de columnas
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          ALTER TABLE public.rsvp 
          ALTER COLUMN asistencia TYPE text,
          DROP CONSTRAINT IF EXISTS rsvp_asistencia_check,
          ADD CONSTRAINT rsvp_asistencia_check CHECK (asistencia IN ('asistire', 'no_puedo_ir'));
          
          ALTER TABLE public.rsvp
          ALTER COLUMN menu TYPE text;
        `
      });
      
      if (sqlError) {
        // Si no funciona el RPC (que requiere permisos especiales), mostrar instrucciones
        console.error("Error al ejecutar SQL directo:", sqlError);
        setError(`No se pudo ejecutar SQL directamente. Por favor, ejecuta el script en el SQL Editor de Supabase.`);
        return;
      }
      
      // Recargar información de la tabla
      const infoResponse = await fetch('/api/rsvp-structure');
      const infoData = await infoResponse.json();
      if (!infoResponse.ok) {
        throw new Error('Error al actualizar información de tabla');
      }
      setTableInfo(infoData);
      
      alert('Estructura de tabla corregida exitosamente');
      
    } catch (err: any) {
      console.error('Error al corregir tipos de columnas:', err);
      setError(`Error: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }
  
  if (role !== 'admin' && role !== 'prometidos') {
    return <div className="p-8">Redirigiendo a login...</div>;
  }
  
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="text-2xl font-bold mb-6">Estructura de Tabla RSVP</h1>
        
        <div className="mb-6">
          <Link href="/admin/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Volver al Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            
            {error.includes('SQL') && (
              <div className="mt-2">
                <p className="font-bold">SQL para ejecutar en Supabase:</p>
                <pre className="bg-gray-800 text-white p-4 rounded overflow-auto text-sm mt-2">
                  {`
ALTER TABLE public.rsvp 
ALTER COLUMN asistencia TYPE text,
DROP CONSTRAINT IF EXISTS rsvp_asistencia_check,
ADD CONSTRAINT rsvp_asistencia_check CHECK (asistencia IN ('asistire', 'no_puedo_ir'));

ALTER TABLE public.rsvp
ALTER COLUMN menu TYPE text;
                  `}
                </pre>
              </div>
            )}
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
                          <td className={`py-2 px-4 border ${
                            (col.column_name === 'asistencia' && col.data_type !== 'text') ||
                            (col.column_name === 'menu' && col.data_type !== 'text')
                              ? 'text-red-600 font-bold' : ''
                          }`}>
                            {col.data_type}
                            {(col.column_name === 'asistencia' && col.data_type !== 'text') && 
                              ' ⚠️ Debería ser text'}
                            {(col.column_name === 'menu' && col.data_type !== 'text') && 
                              ' ⚠️ Debería ser text'}
                          </td>
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
                  onClick={fixTableStructure}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  disabled={loading}
                >
                  Corregir Estructura de Tabla
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
                          <td className="py-2 px-4 border">
                            {record.asistencia === true ? 'true ⚠️' : 
                             record.asistencia === false ? 'false ⚠️' : 
                             record.asistencia}
                          </td>
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
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Políticas de Seguridad (RLS)</h2>
              
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Nota sobre políticas RLS:</p>
                <p>Las políticas RLS (Row Level Security) controlan qué filas puede ver, insertar o modificar cada usuario.</p>
                <p className="mt-2">Si recibes errores de "row-level security policy" al crear RSVPs, 
                necesitas configurar las políticas RLS adecuadas en Supabase.</p>
              </div>
              
              <div className="mt-4">
                <a 
                  href="/scripts/fix_rsvp_rls.sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block mr-2"
                >
                  Ver Script de Corrección RLS
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
