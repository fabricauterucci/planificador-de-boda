ALTER TABLE users DISABLE ROW LEVEL SECURITY;


update users 
set rol = 'admin'
where id = '';