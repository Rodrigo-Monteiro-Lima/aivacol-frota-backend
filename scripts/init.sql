IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'aivacol_frota')
BEGIN
    CREATE DATABASE aivacol_frota;
END