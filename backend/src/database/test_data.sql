-- ============================================================================
-- BIZRISE — Datos de Prueba
-- ============================================================================
-- Contraseña general: Pass123!
-- Admin: admin@bizrise.pe / Admin123!
-- Ejecutar estando en la BD BizRiseDB:
--     USE BizRiseDB; GO; :r test_data.sql
-- ============================================================================

USE BizRiseDB;
GO

BEGIN TRANSACTION;
GO

-- ============================================================================
-- 1. USUARIOS — Emprendedores (rol: emprendedor)
-- ============================================================================
-- Hash bcrypt de "Pass123!" (generado con passlib)
DECLARE @hash VARCHAR(255) = '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq';
DECLARE @admin_hash VARCHAR(255) = '$2b$12$NgHUOt6vZkG.p2L9rT1dq.hbQbGzpRrpDxuoIeiDLyNmWB.ZRzoa2';

-- Admin (si no existe)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE correo = 'admin@bizrise.pe')
BEGIN
    INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol)
    VALUES ('Admin', 'BizRise', 'admin@bizrise.pe', @admin_hash, 'administrador');
    PRINT '✓ Admin creado';
END
ELSE
    PRINT '→ Admin ya existe';
GO

-- Emprendedores
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE correo = 'marco.solis@email.com')
BEGIN
    INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
    ('Marco Antonio', 'Solís Ríos',       'marco.solis@email.com',      @hash, 'emprendedor'),
    ('Elena',         'Poma Villanueva',   'elena.poma@email.com',       @hash, 'emprendedor'),
    ('Juan Carlos',   'Huamán Torre',      'juan.huaman@email.com',      @hash, 'emprendedor'),
    ('Lucía',         'Mendoza Carhuas',   'lucia.mendoza@email.com',    @hash, 'emprendedor'),
    ('Roberto',       'Quispe Malpartida',  'roberto.quispe@email.com',   @hash, 'emprendedor'),
    ('Carmen Rosa',   'Lazo Flores',        'carmen.lazo@email.com',      @hash, 'emprendedor'),
    ('Diego',         'Ramos Apolinario',   'diego.ramos@email.com',      @hash, 'emprendedor'),
    ('Silvia',        'Castro Ore',         'silvia.castro@email.com',    @hash, 'emprendedor'),
    ('Miguel Ángel',  'Torres Vega',        'miguel.torres@email.com',    @hash, 'emprendedor'),
    ('Ana María',     'Benites Cano',       'ana.benites@email.com',      @hash, 'emprendedor');
    PRINT '✓ 10 emprendedores creados';
END
ELSE
    PRINT '→ Emprendedores ya existen';
GO

-- Clientes (rol: visitante)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE correo = 'cliente1@email.com')
BEGIN
    INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
    ('Ricardo',         'Mendoza Alanya',  'cliente1@email.com',  @hash, 'visitante'),
    ('Patricia',        'Flores Romero',   'cliente2@email.com',  @hash, 'visitante'),
    ('José Luis',       'Paredes Vega',    'cliente3@email.com',  @hash, 'visitante'),
    ('María Elena',     'Quispe Torres',   'cliente4@email.com',  @hash, 'visitante'),
    ('Carlos Andrés',   'Ramos Soto',      'cliente5@email.com',  @hash, 'visitante'),
    ('Sofía Valentina', 'Cruz Mendoza',    'cliente6@email.com',  @hash, 'visitante'),
    ('Fernando Alexis', 'Huamán Ríos',     'cliente7@email.com',  @hash, 'visitante'),
    ('Gabriela Lucía',  'Poma Vargas',     'cliente8@email.com',  @hash, 'visitante'),
    ('Andrés Felipe',   'Lazo Carhuas',    'cliente9@email.com',  @hash, 'visitante'),
    ('Daniela Rosaura', 'Torres Ore',      'cliente10@email.com', @hash, 'visitante');
    PRINT '✓ 10 clientes creados';
END
ELSE
    PRINT '→ Clientes ya existen';
GO

-- ============================================================================
-- 2. EMPRENDIMIENTOS
-- ============================================================================
DECLARE @uid_marco INT, @uid_elena INT, @uid_juan INT, @uid_lucia INT,
        @uid_roberto INT, @uid_carmen INT, @uid_diego INT, @uid_silvia INT,
        @uid_miguel INT, @uid_ana INT;

SELECT @uid_marco   = id_usuario FROM Usuarios WHERE correo = 'marco.solis@email.com';
SELECT @uid_elena   = id_usuario FROM Usuarios WHERE correo = 'elena.poma@email.com';
SELECT @uid_juan    = id_usuario FROM Usuarios WHERE correo = 'juan.huaman@email.com';
SELECT @uid_lucia   = id_usuario FROM Usuarios WHERE correo = 'lucia.mendoza@email.com';
SELECT @uid_roberto = id_usuario FROM Usuarios WHERE correo = 'roberto.quispe@email.com';
SELECT @uid_carmen  = id_usuario FROM Usuarios WHERE correo = 'carmen.lazo@email.com';
SELECT @uid_diego   = id_usuario FROM Usuarios WHERE correo = 'diego.ramos@email.com';
SELECT @uid_silvia  = id_usuario FROM Usuarios WHERE correo = 'silvia.castro@email.com';
SELECT @uid_miguel  = id_usuario FROM Usuarios WHERE correo = 'miguel.torres@email.com';
SELECT @uid_ana     = id_usuario FROM Usuarios WHERE correo = 'ana.benites@email.com';

-- Gastronomía = 1, Textilería = 2, Artesanía = 3, Servicios = 4
-- Turismo = 5, Tecnología = 6

IF NOT EXISTS (SELECT 1 FROM Emprendimientos WHERE id_usuario = @uid_marco)
BEGIN
    INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito, horario_apertura, horario_cierre, estado_verificacion) VALUES
    (@uid_marco,   1, 'Café Central Huancayo',     'Cafetería especializada en granos de altura del Valle del Mantaro. Ambiente acogedor para trabajar y reunirse.',                             '964123456', 'Calle Real 450',               'Huancayo',  '08:00', '21:00', 'pendiente'),
    (@uid_elena,   2, 'Textiles Mantaro',           'Confecciones artesanales con lana de alpaca seleccionada de la región Junín. Diseños tradicionales modernizados.',                          '964234567', 'Jr. Loreto 234',               'El Tambo',   NULL,    NULL,   'pendiente'),
    (@uid_juan,    3, 'Artesanías del Valle',       'Arte tradicional del Valle del Mantaro. Piezas únicas hechas a mano representando la cultura Wanka.',                                       '964345678', 'Av. Ferrocarril 567',          'Chilca',     NULL,    NULL,   'pendiente'),
    (@uid_lucia,   1, 'Restaurante El Mirador',     'Tradición y modernidad en cada plato. La mejor vista del Valle del Mantaro con sabores auténticos de Junín.',                               '964456789', 'Jr. Ayacucho 123',             'Huancayo',   '12:00', '22:00', 'pendiente'),
    (@uid_roberto, 6, 'TechSolutions Huancayo',     'Desarrollo web, aplicaciones móviles y soporte técnico para empresas locales. Soluciones digitales a medida.',                              '964567890', 'Av. Giráldez 890',             'El Tambo',   NULL,    NULL,   'pendiente'),
    (@uid_carmen,  5, 'Turismo Aventura Junín',     'Tours por los atractivos de Junín: Huancaya, Nor Yauyos, Reserva de Junín. Guías certificados y transporte incluido.',                      '964678901', 'Calle Piura 456',              'Huancayo',   NULL,    NULL,   'pendiente'),
    (@uid_diego,   1, 'Panadería San Agustín',      'Pan artesanal horneado cada mañana con recetas tradicionales de Huancayo. Masa madre y granos locales.',                                    '964789012', 'Jr. Puno 789',                 'San Agustín','06:00', '20:00', 'pendiente'),
    (@uid_silvia,  4, 'Estudio Contable Castro',    'Servicios contables, tributarios y laborales para MYPES y emprendedores de Huancayo. Asesoría personalizada.',                              '964890123', 'Av. Huancavelica 234',         'Huancayo',   NULL,    NULL,   'pendiente'),
    (@uid_miguel,  4, 'Vivero Los Andes',           'Plantas ornamentales, frutales y medicinales del centro del Perú. Servicio de jardinería y paisajismo.',                                   '964901234', 'Carretera Central Km 5',       'Pilcomayo',  NULL,    NULL,   'pendiente'),
    (@uid_ana,     2, 'Moda Andina Boutique',       'Ropa y accesorios con diseños andinos contemporáneos. Fusión de tradición y tendencia para la mujer moderna.',                              '964012345', 'Jr. Lima 567',                 'Huancayo',   NULL,    NULL,   'pendiente');
    PRINT '✓ 10 emprendimientos creados (pendientes de aprobación)';
END
ELSE
    PRINT '→ Emprendimientos ya existen';
GO

-- ============================================================================
-- 3. PRODUCTOS
-- ============================================================================
DECLARE @biz_marco INT, @biz_elena INT, @biz_juan INT, @biz_lucia INT,
        @biz_roberto INT, @biz_carmen INT, @biz_diego INT, @biz_silvia INT,
        @biz_miguel INT, @biz_ana INT;

SELECT @biz_marco   = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_marco;
SELECT @biz_elena   = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_elena;
SELECT @biz_juan    = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_juan;
SELECT @biz_lucia   = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_lucia;
SELECT @biz_roberto = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_roberto;
SELECT @biz_carmen  = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_carmen;
SELECT @biz_diego   = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_diego;
SELECT @biz_silvia  = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_silvia;
SELECT @biz_miguel  = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_miguel;
SELECT @biz_ana     = id_emprendimiento FROM Emprendimientos WHERE id_usuario = @uid_ana;

-- Café Central Huancayo
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_marco AND nombre = 'Latte de la Casa')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_marco,   'Latte de la Casa',       'Café latte con leche vaporizada',                 12.00,  50, 'disponible'),
    (@biz_marco,   'Tostado Especial',        'Café tostado artesanal 250g',                     16.50,  30, 'disponible'),
    (@biz_marco,   'Cheesecake de Maracuyá',  'Porción de cheesecake con maracuyá',              8.00,   20, 'disponible');
END

-- Textiles Mantaro
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_elena AND nombre = 'Manta Huancaína Premium')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_elena,   'Manta Huancaína Premium',  'Manta artesanal de lana de alpaca premium',       120.00, 15, 'bajo_stock'),
    (@biz_elena,   'Chalina de Alpaca',        'Chalina suave de alpaca',                         65.00,  25, 'disponible'),
    (@biz_elena,   'Guantes Artesanales',      'Guantes tejidos a mano',                          35.00,  40, 'disponible');
END

-- Artesanías del Valle
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_juan AND nombre = 'Mate Burilado Grande')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_juan,    'Mate Burilado Grande',     'Mate burilado hecho a mano tamaño grande',        85.00,  10, 'bajo_stock'),
    (@biz_juan,    'Retablo Ayacuchano',       'Retablo artesanal tradicional',                    150.00,  5,  'bajo_stock'),
    (@biz_juan,    'Cerámica Decorativa',      'Cerámica pintada a mano',                          45.00,  20, 'disponible');
END

-- Restaurante El Mirador
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_lucia AND nombre = 'Pachamanca Familiar')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_lucia,   'Pachamanca Familiar',      'Pachamanca para 4 personas',                       85.00,  10, 'disponible'),
    (@biz_lucia,   'Trucha al Vapor',          'Trucha fresca del Mantaro al vapor',               35.00,  20, 'disponible'),
    (@biz_lucia,   'Caldo de Gallina',         'Caldo de gallina de corral',                       18.00,  30, 'disponible'),
    (@biz_lucia,   'Chicha Morada',            'Chicha morada artesanal 1L',                       5.00,   50, 'disponible');
END

-- TechSolutions Huancayo
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_roberto AND nombre = 'Diseño Web')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_roberto, 'Diseño Web',               'Diseño y desarrollo web responsive',                800.00, 999, 'disponible'),
    (@biz_roberto, 'App Móvil',                'Desarrollo de aplicación móvil',                    2500.00, 999, 'disponible'),
    (@biz_roberto, 'Soporte Mensual',          'Soporte técnico mensual',                           150.00, 999, 'disponible');
END

-- Turismo Aventura Junín
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_carmen AND nombre = 'Tour Huancaya 2 días')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_carmen,  'Tour Huancaya 2 días',     'Tour completo a Huancaya 2 días/1 noche',          250.00, 50,  'disponible'),
    (@biz_carmen,  'City Tour Huancayo',       'City Tour por Huancayo medio día',                  45.00,  100, 'disponible'),
    (@biz_carmen,  'Tour Reserva de Junín',    'Tour a la Reserva Nacional de Junín',               180.00, 50,  'disponible');
END

-- Panadería San Agustín
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_diego AND nombre = 'Pan de Masa Madre')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_diego,   'Pan de Masa Madre',        'Pan artesanal de masa madre 500g',                  4.00,   100, 'disponible'),
    (@biz_diego,   'Torta de Zanahoria',       'Torta de zanahoria con glaseado',                   25.00,  15,  'bajo_stock'),
    (@biz_diego,   'Empanadas',                'Empanadas de horno surtidas',                       3.00,   80,  'disponible');
END

-- Estudio Contable Castro
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_silvia AND nombre = 'Contabilidad Mensual')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_silvia,  'Contabilidad Mensual',     'Servicio de contabilidad mensual',                  200.00, 999, 'disponible'),
    (@biz_silvia,  'Declaración Anual',        'Declaración anual de impuestos',                    350.00, 999, 'disponible'),
    (@biz_silvia,  'Planillas',                'Gestión de planillas mensuales',                    150.00, 999, 'disponible');
END

-- Vivero Los Andes
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_miguel AND nombre = 'Planta Ornamental')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_miguel,  'Planta Ornamental',        'Planta ornamental en maceta',                       15.00,  200, 'disponible'),
    (@biz_miguel,  'Frutal Injertado',         'Árbol frutal injertado',                            35.00,  50,  'disponible'),
    (@biz_miguel,  'Servicio Jardinería',      'Servicio de jardinería completo',                   120.00, 999, 'disponible');
END

-- Moda Andina Boutique
IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_emprendimiento = @biz_ana AND nombre = 'Vestido Andino')
BEGIN
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (@biz_ana,     'Vestido Andino',           'Vestido con diseños andinos contemporáneos',        180.00, 10,  'bajo_stock'),
    (@biz_ana,     'Cartera Artesanal',        'Cartera tejida a mano',                             95.00,  15,  'disponible'),
    (@biz_ana,     'Blusa Bordada',            'Blusa con bordados tradicionales',                  75.00,  20,  'disponible');
END
GO
PRINT '✓ 32 productos creados';

-- ============================================================================
-- 4. PROMOCIONES
-- ============================================================================
DECLARE @hoy DATE = CAST(GETDATE() AS DATE);

-- Café Central: 2x1 Americanos (vence en 90 días)
IF NOT EXISTS (SELECT 1 FROM Promociones WHERE id_emprendimiento = @biz_marco AND titulo = '2x1 en Americanos los martes')
BEGIN
    INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado) VALUES
    (@biz_marco, '2x1 en Americanos los martes', 'Todos los martes, 2x1 en Americanos', @hoy, DATEADD(DAY, 90, @hoy), 'activa');
END

-- Textiles Mantaro: 20% descuento (vence en 60 días)
IF NOT EXISTS (SELECT 1 FROM Promociones WHERE id_emprendimiento = @biz_elena AND titulo = '20% de descuento en mantas')
BEGIN
    INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado) VALUES
    (@biz_elena, '20% de descuento en mantas', 'Descuento especial en mantas huancaínas', @hoy, DATEADD(DAY, 60, @hoy), 'activa');
END
GO
PRINT '✓ 2 promociones creadas';

-- ============================================================================
-- 5. VALORACIONES Y COMENTARIOS (reseñas combinadas)
-- ============================================================================
-- Nota: sp_CreateReview maneja la inserción combinada en Comentarios y Valoraciones
-- así como la validación de que usuario ≠ propietario.
-- Aquí usamos INSERT directo por simplicidad en el seed.

DECLARE @uid_c1 INT, @uid_c2 INT, @uid_c3 INT, @uid_c4 INT, @uid_c5 INT,
        @uid_c6 INT, @uid_c7 INT, @uid_c8 INT, @uid_c9 INT, @uid_c10 INT;

SELECT @uid_c1  = id_usuario FROM Usuarios WHERE correo = 'cliente1@email.com';
SELECT @uid_c2  = id_usuario FROM Usuarios WHERE correo = 'cliente2@email.com';
SELECT @uid_c3  = id_usuario FROM Usuarios WHERE correo = 'cliente3@email.com';
SELECT @uid_c4  = id_usuario FROM Usuarios WHERE correo = 'cliente4@email.com';
SELECT @uid_c5  = id_usuario FROM Usuarios WHERE correo = 'cliente5@email.com';
SELECT @uid_c6  = id_usuario FROM Usuarios WHERE correo = 'cliente6@email.com';
SELECT @uid_c7  = id_usuario FROM Usuarios WHERE correo = 'cliente7@email.com';
SELECT @uid_c8  = id_usuario FROM Usuarios WHERE correo = 'cliente8@email.com';
SELECT @uid_c9  = id_usuario FROM Usuarios WHERE correo = 'cliente9@email.com';
SELECT @uid_c10 = id_usuario FROM Usuarios WHERE correo = 'cliente10@email.com';

-- Cafe Central (negocio 1)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c1 AND id_emprendimiento = @biz_marco)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c1, @biz_marco, 'Excelente café, el ambiente es muy acogedor. Ideal para trabajar.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c1, @biz_marco, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c2, @biz_marco, 'Buen café, pero el servicio puede mejorar los fines de semana.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c2, @biz_marco, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c3, @biz_marco, 'Los precios son razonables y la atención es buena.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c3, @biz_marco, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c4, @biz_marco, 'Me encanta el latte de la casa, muy recomendado.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c4, @biz_marco, 5);
END

-- Textiles Mantaro (negocio 2)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c1 AND id_emprendimiento = @biz_elena)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c1, @biz_elena, 'Las chalinas son de muy buena calidad, compré una para regalo.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c1, @biz_elena, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c2, @biz_elena, 'Hermosos textiles, la lana de alpaca es suave y cálida.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c2, @biz_elena, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c5, @biz_elena, 'Buenos productos, pero los precios son un poco elevados.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c5, @biz_elena, 3);
END

-- Artesanías del Valle (negocio 3)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c1 AND id_emprendimiento = @biz_juan)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c1, @biz_juan, 'Piezas únicas, el retablo que compré es una obra de arte.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c1, @biz_juan, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c3, @biz_juan, 'Artesanía de primera calidad, muy recomendado.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c3, @biz_juan, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c6, @biz_juan, 'Los mates burilados son hermosos, volveré por más.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c6, @biz_juan, 5);
END

-- Restaurante El Mirador (negocio 4)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c4 AND id_emprendimiento = @biz_lucia)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c4, @biz_lucia, 'La pachamanca es deliciosa, la vista del local es increíble.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c4, @biz_lucia, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c7, @biz_lucia, 'Buena atención, la trucha al vapor es mi plato favorito.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c7, @biz_lucia, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c2, @biz_lucia, 'El caldo de gallina es como el de mi abuela, delicioso.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c2, @biz_lucia, 5);
END

-- TechSolutions (negocio 5)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c5 AND id_emprendimiento = @biz_roberto)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c5, @biz_roberto, 'Excelente servicio de desarrollo web, muy profesionales.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c5, @biz_roberto, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c8, @biz_roberto, 'Buen soporte técnico, responden rápido a las solicitudes.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c8, @biz_roberto, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c3, @biz_roberto, 'El diseño web que hicieron para mi negocio es espectacular.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c3, @biz_roberto, 5);
END

-- Turismo Aventura (negocio 6)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c6 AND id_emprendimiento = @biz_carmen)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c6, @biz_carmen, 'El tour a Huancaya fue increíble, paisajes maravillosos.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c6, @biz_carmen, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c9, @biz_carmen, 'Guías muy conocedores, aprendí mucho sobre la región.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c9, @biz_carmen, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c1, @biz_carmen, 'City tour muy completo, conocí lugares que no sabía que existían.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c1, @biz_carmen, 4);
END

-- Panadería San Agustín (negocio 7)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c7 AND id_emprendimiento = @biz_diego)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c7, @biz_diego, 'El pan de masa madre es el mejor de Huancayo, siempre compro aquí.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c7, @biz_diego, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c4, @biz_diego, 'Las empanadas son deliciosas y frescas cada mañana.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c4, @biz_diego, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c10, @biz_diego, 'La torta de zanahoria es espectacular, muy recomendada.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c10, @biz_diego, 5);
END

-- Estudio Contable Castro (negocio 8)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c8 AND id_emprendimiento = @biz_silvia)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c8, @biz_silvia, 'Asesoría contable muy clara y profesional, me ayudaron mucho.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c8, @biz_silvia, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c5, @biz_silvia, 'Buen servicio contable, precios justos para emprendedores.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c5, @biz_silvia, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c2, @biz_silvia, 'Me resolvieron todas mis dudas tributarias, muy agradecido.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c2, @biz_silvia, 5);
END

-- Vivero Los Andes (negocio 9)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c9 AND id_emprendimiento = @biz_miguel)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c9, @biz_miguel, 'Las plantas son de excelente calidad, el servicio de jardinería también.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c9, @biz_miguel, 4);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c6, @biz_miguel, 'Compré un frutal injertado y creció hermoso, muy recomendado.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c6, @biz_miguel, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c3, @biz_miguel, 'Buena variedad de plantas ornamentales, precios accesibles.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c3, @biz_miguel, 4);
END

-- Moda Andina Boutique (negocio 10)
IF NOT EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @uid_c10 AND id_emprendimiento = @biz_ana)
BEGIN
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c10, @biz_ana, 'El vestido andino es hermoso, la tela es de gran calidad.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c10, @biz_ana, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c7, @biz_ana, 'Diseños únicos, me encanta la fusión de tradición y moda.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c7, @biz_ana, 5);

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES
    (@uid_c4, @biz_ana, 'La cartera artesanal es preciosa, todas me preguntan dónde la compré.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (@uid_c4, @biz_ana, 5);
END
GO
PRINT '✓ 32 reseñas creadas (comentario + valoración)';

-- ============================================================================
-- RESUMEN
-- ============================================================================
GO
PRINT '';
PRINT '==============================';
PRINT '  RESEED COMPLETADO';
PRINT '==============================';
PRINT '  1 admin        → admin@bizrise.pe / Admin123!';
PRINT '  10 emprendedores → *@email.com / Pass123!';
PRINT '  10 negocios     → estado: pendiente (aprobar desde el panel)';
PRINT '  32 productos';
PRINT '  2 promociones';
PRINT '  32 reseñas (comentario + valoración)';
PRINT '  10 clientes    → clienteN@email.com / Pass123!';
PRINT '==============================';
GO

COMMIT TRANSACTION;
GO
