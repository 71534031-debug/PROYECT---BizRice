-- =====================================================
-- BIZRISE — DATOS COMPLETOS PARA NEON
-- =====================================================
-- Ejecutar DESPUÉS de neon_schema.sql en el SQL Editor
-- =====================================================

-- =========================
-- CATEGORÍAS (9)
-- =========================
INSERT INTO Categorias (nombre, descripcion) VALUES
('Gastronomía',       'Restaurantes, cafeterías y comida típica'),
('Textilería y Moda', 'Ropa, telas, confecciones y accesorios'),
('Artesanía',         'Productos artesanales y arte tradicional'),
('Servicios',         'Servicios profesionales y personales'),
('Turismo',           'Agencias y experiencias turísticas'),
('Tecnología',        'Soluciones digitales y desarrollo'),
('Belleza',           'Cuidado personal, estética y cosmética'),
('Agricultura',       'Productos agrícolas y derivados'),
('Hogar',             'Decoración, muebles y artículos para el hogar')
ON CONFLICT DO NOTHING;

-- =========================
-- USUARIOS
-- =========================
-- admin@bizrise.pe / Admin123!
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Admin', 'BizRise', 'admin@bizrise.pe',
 '$2b$12$OhIry1VsJ6IMSi2g13Rx1.Caq4g0JX.c2Egwn4h.d7sYfR0Lo27KG',
 'administrador')
ON CONFLICT (correo) DO NOTHING;

-- emprendedor@bizrise.pe / Emprendedor1!
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Pedro', 'Huamán', 'emprendedor@bizrise.pe',
 '$2b$12$06vPY4xP.Jhak93JWMztOeP2GWZAFpxb/R98KzF5DSmjPgfHfx8wC',
 'emprendedor')
ON CONFLICT (correo) DO NOTHING;

-- cliente@bizrise.pe / Cliente1!
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Lucía', 'Mendoza', 'cliente@bizrise.pe',
 '$2b$12$my8GvV2aU0UckjJNcsHu.eOItrGJaa9Qdtaz0m20GDgNVbZIhouZ2',
 'cliente')
ON CONFLICT (correo) DO NOTHING;

-- 10 emprendedores adicionales (Pass123!)
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Marco Antonio', 'Solís Ríos',       'marco.solis@email.com',      '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Elena',         'Poma Villanueva',   'elena.poma@email.com',       '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Juan Carlos',   'Huamán Torre',      'juan.huaman@email.com',      '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Roberto',       'Quispe Malpartida', 'roberto.quispe@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Carmen Rosa',   'Lazo Flores',        'carmen.lazo@email.com',      '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Diego',         'Ramos Apolinario',   'diego.ramos@email.com',      '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Silvia',        'Castro Ore',         'silvia.castro@email.com',    '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Miguel Ángel',  'Torres Vega',        'miguel.torres@email.com',    '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Ana María',     'Benites Cano',       'ana.benites@email.com',      '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
('Pedro Pablo',   'García Ruiz',        'pedro.garcia@email.com',      '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor')
ON CONFLICT (correo) DO NOTHING;

-- 10 clientes (Pass123!)
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Ricardo',     'Mendoza Alanya', 'cliente1@email.com',  '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Patricia',    'Flores Romero',  'cliente2@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('José Luis',   'Paredes Vega',   'cliente3@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('María Elena', 'Quispe Torres',  'cliente4@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Carlos',      'Ramos Soto',     'cliente5@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Sofía',       'Cruz Mendoza',   'cliente6@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Fernando',    'Huamán Ríos',    'cliente7@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Gabriela',    'Poma Vargas',    'cliente8@email.com',   '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Andrés',      'Lazo Carhuas',    'cliente9@email.com',  '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante'),
('Daniela',     'Torres Ore',      'cliente10@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'visitante')
ON CONFLICT (correo) DO NOTHING;

-- =========================
-- EMPRENDIMIENTOS (10, todos aprobados)
-- =========================
DO $$
DECLARE
    uid_marco INT; uid_elena INT; uid_juan INT; uid_roberto INT;
    uid_carmen INT; uid_diego INT; uid_silvia INT; uid_miguel INT;
    uid_ana INT; uid_pedro_pablo INT;
    biz_marco INT; biz_elena INT; biz_juan INT; biz_roberto INT;
    biz_carmen INT; biz_diego INT; biz_silvia INT; biz_miguel INT;
    biz_ana INT; biz_pedro_pablo INT;
    uid_c1 INT; uid_c2 INT; uid_c3 INT; uid_c4 INT; uid_c5 INT;
    uid_c6 INT; uid_c7 INT; uid_c8 INT; uid_c9 INT; uid_c10 INT;
BEGIN
    -- Obtener IDs de usuarios
    SELECT id_usuario INTO uid_marco       FROM Usuarios WHERE correo = 'marco.solis@email.com';
    SELECT id_usuario INTO uid_elena       FROM Usuarios WHERE correo = 'elena.poma@email.com';
    SELECT id_usuario INTO uid_juan        FROM Usuarios WHERE correo = 'juan.huaman@email.com';
    SELECT id_usuario INTO uid_roberto     FROM Usuarios WHERE correo = 'roberto.quispe@email.com';
    SELECT id_usuario INTO uid_carmen      FROM Usuarios WHERE correo = 'carmen.lazo@email.com';
    SELECT id_usuario INTO uid_diego       FROM Usuarios WHERE correo = 'diego.ramos@email.com';
    SELECT id_usuario INTO uid_silvia      FROM Usuarios WHERE correo = 'silvia.castro@email.com';
    SELECT id_usuario INTO uid_miguel      FROM Usuarios WHERE correo = 'miguel.torres@email.com';
    SELECT id_usuario INTO uid_ana        FROM Usuarios WHERE correo = 'ana.benites@email.com';
    SELECT id_usuario INTO uid_pedro_pablo FROM Usuarios WHERE correo = 'pedro.garcia@email.com';

    -- Insertar emprendimientos (TODOS aprobados para que se vean)
    INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito, horario_apertura, horario_cierre, estado_verificacion) VALUES
    (uid_marco,   1, 'Café Central Huancayo',   'Cafetería especializada en granos de altura del Valle del Mantaro. Ambiente acogedor para trabajar y reunirse.',               '964123456', 'Calle Real 450',          'Huancayo',  '08:00', '21:00', 'aprobado'),
    (uid_elena,   2, 'Textiles Mantaro',         'Confecciones artesanales con lana de alpaca seleccionada de la región Junín. Diseños tradicionales modernizados.',            '964234567', 'Jr. Loreto 234',          'El Tambo',   NULL,    NULL,   'aprobado'),
    (uid_juan,    3, 'Artesanías del Valle',     'Arte tradicional del Valle del Mantaro. Piezas únicas hechas a mano representando la cultura Wanka.',                        '964345678', 'Av. Ferrocarril 567',     'Chilca',     NULL,    NULL,   'aprobado'),
    (uid_pedro_pablo, 1, 'Restaurante El Mirador', 'Tradición y modernidad en cada plato. La mejor vista del Valle del Mantaro con sabores auténticos de Junín.',               '964456789', 'Jr. Ayacucho 123',        'Huancayo',   '12:00', '22:00', 'aprobado'),
    (uid_roberto, 6, 'TechSolutions Huancayo',   'Desarrollo web, aplicaciones móviles y soporte técnico para empresas locales. Soluciones digitales a medida.',                '964567890', 'Av. Giráldez 890',        'El Tambo',   NULL,    NULL,   'aprobado'),
    (uid_carmen,  5, 'Turismo Aventura Junín',   'Tours por los atractivos de Junín: Huancaya, Nor Yauyos, Reserva de Junín. Guías certificados y transporte incluido.',        '964678901', 'Calle Piura 456',         'Huancayo',   NULL,    NULL,   'aprobado'),
    (uid_diego,   1, 'Panadería San Agustín',    'Pan artesanal horneado cada mañana con recetas tradicionales de Huancayo. Masa madre y granos locales.',                      '964789012', 'Jr. Puno 789',            'San Agustín','06:00', '20:00', 'aprobado'),
    (uid_silvia,  4, 'Estudio Contable Castro',  'Servicios contables, tributarios y laborales para MYPES y emprendedores de Huancayo. Asesoría personalizada.',                '964890123', 'Av. Huancavelica 234',    'Huancayo',   NULL,    NULL,   'aprobado'),
    (uid_miguel,  4, 'Vivero Los Andes',         'Plantas ornamentales, frutales y medicinales del centro del Perú. Servicio de jardinería y paisajismo.',                     '964901234', 'Carretera Central Km 5',  'Pilcomayo',  NULL,    NULL,   'aprobado'),
    (uid_ana,     2, 'Moda Andina Boutique',     'Ropa y accesorios con diseños andinos contemporáneos. Fusión de tradición y tendencia para la mujer moderna.',                 '964012345', 'Jr. Lima 567',            'Huancayo',   NULL,    NULL,   'aprobado')
    RETURNING id_emprendimiento INTO biz_marco;

    -- Obtener IDs de negocios
    SELECT id_emprendimiento INTO biz_marco       FROM Emprendimientos WHERE id_usuario = uid_marco;
    SELECT id_emprendimiento INTO biz_elena       FROM Emprendimientos WHERE id_usuario = uid_elena;
    SELECT id_emprendimiento INTO biz_juan        FROM Emprendimientos WHERE id_usuario = uid_juan;
    SELECT id_emprendimiento INTO biz_roberto     FROM Emprendimientos WHERE id_usuario = uid_roberto;
    SELECT id_emprendimiento INTO biz_carmen      FROM Emprendimientos WHERE id_usuario = uid_carmen;
    SELECT id_emprendimiento INTO biz_diego       FROM Emprendimientos WHERE id_usuario = uid_diego;
    SELECT id_emprendimiento INTO biz_silvia      FROM Emprendimientos WHERE id_usuario = uid_silvia;
    SELECT id_emprendimiento INTO biz_miguel      FROM Emprendimientos WHERE id_usuario = uid_miguel;
    SELECT id_emprendimiento INTO biz_ana        FROM Emprendimientos WHERE id_usuario = uid_ana;
    SELECT id_emprendimiento INTO biz_pedro_pablo FROM Emprendimientos WHERE id_usuario = uid_pedro_pablo;

    -- PRODUCTOS
    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock) VALUES
    (biz_marco,  'Latte de la Casa',      'Café latte con leche vaporizada',               12.00,  50, 'disponible'),
    (biz_marco,  'Tostado Especial',       'Café tostado artesanal 250g',                   16.50,  30, 'disponible'),
    (biz_marco,  'Cheesecake de Maracuyá', 'Porción de cheesecake con maracuyá',            8.00,   20, 'disponible'),
    (biz_elena,  'Manta Huancaína Premium','Manta artesanal de lana de alpaca premium',     120.00, 15, 'bajo_stock'),
    (biz_elena,  'Chalina de Alpaca',      'Chalina suave de alpaca',                        65.00,  25, 'disponible'),
    (biz_elena,  'Guantes Artesanales',    'Guantes tejidos a mano',                         35.00,  40, 'disponible'),
    (biz_juan,   'Mate Burilado Grande',   'Mate burilado hecho a mano tamaño grande',       85.00,  10, 'bajo_stock'),
    (biz_juan,   'Retablo Ayacuchano',     'Retablo artesanal tradicional',                   150.00,  5, 'bajo_stock'),
    (biz_juan,   'Cerámica Decorativa',    'Cerámica pintada a mano',                         45.00,  20, 'disponible'),
    (biz_pedro_pablo, 'Pachamanca Familiar','Pachamanca para 4 personas',                     85.00,  10, 'disponible'),
    (biz_pedro_pablo, 'Trucha al Vapor',   'Trucha fresca del Mantaro al vapor',              35.00,  20, 'disponible'),
    (biz_pedro_pablo, 'Caldo de Gallina',  'Caldo de gallina de corral',                      18.00,  30, 'disponible'),
    (biz_roberto,'Diseño Web',              'Diseño y desarrollo web responsive',             800.00, 999, 'disponible'),
    (biz_roberto,'App Móvil',               'Desarrollo de aplicación móvil',                 2500.00,999, 'disponible'),
    (biz_carmen, 'Tour Huancaya 2 días',   'Tour completo a Huancaya 2 días/1 noche',        250.00, 50,  'disponible'),
    (biz_carmen, 'City Tour Huancayo',     'City Tour por Huancayo medio día',                45.00,  100, 'disponible'),
    (biz_carmen, 'Tour Reserva de Junín',  'Tour a la Reserva Nacional de Junín',             180.00, 50,  'disponible'),
    (biz_diego,  'Pan de Masa Madre',      'Pan artesanal de masa madre 500g',                4.00,   100, 'disponible'),
    (biz_diego,  'Torta de Zanahoria',     'Torta de zanahoria con glaseado',                 25.00,  15,  'bajo_stock'),
    (biz_diego,  'Empanadas',              'Empanadas de horno surtidas',                      3.00,   80,  'disponible'),
    (biz_silvia, 'Contabilidad Mensual',   'Servicio de contabilidad mensual',                200.00, 999, 'disponible'),
    (biz_silvia, 'Declaración Anual',      'Declaración anual de impuestos',                  350.00, 999, 'disponible'),
    (biz_silvia, 'Planillas',              'Gestión de planillas mensuales',                  150.00, 999, 'disponible'),
    (biz_miguel, 'Planta Ornamental',      'Planta ornamental en maceta',                      15.00, 200, 'disponible'),
    (biz_miguel, 'Frutal Injertado',       'Árbol frutal injertado',                           35.00, 50,  'disponible'),
    (biz_miguel, 'Servicio Jardinería',    'Servicio de jardinería completo',                  120.00, 999, 'disponible'),
    (biz_ana,    'Vestido Andino',         'Vestido con diseños andinos contemporáneos',      180.00, 10,  'bajo_stock'),
    (biz_ana,    'Cartera Artesanal',      'Cartera tejida a mano',                            95.00,  15,  'disponible'),
    (biz_ana,    'Blusa Bordada',          'Blusa con bordados tradicionales',                 75.00,  20,  'disponible');

    -- PROMOCIONES
    INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado) VALUES
    (biz_marco, '2x1 en Americanos los martes', 'Todos los martes, 2x1 en Americanos', CURRENT_DATE, CURRENT_DATE + 90, 'activa'),
    (biz_elena, '20% de descuento en mantas',   'Descuento especial en mantas huancaínas', CURRENT_DATE, CURRENT_DATE + 60, 'activa');

    -- Obtener IDs de clientes
    SELECT id_usuario INTO uid_c1  FROM Usuarios WHERE correo = 'cliente1@email.com';
    SELECT id_usuario INTO uid_c2  FROM Usuarios WHERE correo = 'cliente2@email.com';
    SELECT id_usuario INTO uid_c3  FROM Usuarios WHERE correo = 'cliente3@email.com';
    SELECT id_usuario INTO uid_c4  FROM Usuarios WHERE correo = 'cliente4@email.com';
    SELECT id_usuario INTO uid_c5  FROM Usuarios WHERE correo = 'cliente5@email.com';
    SELECT id_usuario INTO uid_c6  FROM Usuarios WHERE correo = 'cliente6@email.com';
    SELECT id_usuario INTO uid_c7  FROM Usuarios WHERE correo = 'cliente7@email.com';
    SELECT id_usuario INTO uid_c8  FROM Usuarios WHERE correo = 'cliente8@email.com';
    SELECT id_usuario INTO uid_c9  FROM Usuarios WHERE correo = 'cliente9@email.com';
    SELECT id_usuario INTO uid_c10 FROM Usuarios WHERE correo = 'cliente10@email.com';

    -- RESEÑAS (Comentarios + Valoraciones)
    -- Café Central
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c1, biz_marco, 'Excelente café, el ambiente es muy acogedor. Ideal para trabajar.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c1, biz_marco, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c2, biz_marco, 'Buen café, pero el servicio puede mejorar los fines de semana.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c2, biz_marco, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c3, biz_marco, 'Los precios son razonables y la atención es buena.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c3, biz_marco, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c4, biz_marco, 'Me encanta el latte de la casa, muy recomendado.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c4, biz_marco, 5);

    -- Textiles Mantaro
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c1, biz_elena, 'Las chalinas son de muy buena calidad, compré una para regalo.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c1, biz_elena, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c2, biz_elena, 'Hermosos textiles, la lana de alpaca es suave y cálida.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c2, biz_elena, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c5, biz_elena, 'Buenos productos, pero los precios son un poco elevados.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c5, biz_elena, 3);

    -- Artesanías del Valle
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c1, biz_juan, 'Piezas únicas, el retablo que compré es una obra de arte.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c1, biz_juan, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c3, biz_juan, 'Artesanía de primera calidad, muy recomendado.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c3, biz_juan, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c6, biz_juan, 'Los mates burilados son hermosos, volveré por más.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c6, biz_juan, 5);

    -- Restaurante El Mirador
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c4, biz_pedro_pablo, 'La pachamanca es deliciosa, la vista del local es increíble.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c4, biz_pedro_pablo, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c7, biz_pedro_pablo, 'Buena atención, la trucha al vapor es mi plato favorito.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c7, biz_pedro_pablo, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c2, biz_pedro_pablo, 'El caldo de gallina es como el de mi abuela, delicioso.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c2, biz_pedro_pablo, 5);

    -- TechSolutions
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c5, biz_roberto, 'Excelente servicio de desarrollo web, muy profesionales.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c5, biz_roberto, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c8, biz_roberto, 'Buen soporte técnico, responden rápido a las solicitudes.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c8, biz_roberto, 4);

    -- Turismo Aventura
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c6, biz_carmen, 'El tour a Huancaya fue increíble, paisajes maravillosos.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c6, biz_carmen, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c9, biz_carmen, 'Guías muy conocedores, aprendí mucho sobre la región.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c9, biz_carmen, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c1, biz_carmen, 'City tour muy completo, conocí lugares que no sabía que existían.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c1, biz_carmen, 4);

    -- Panadería San Agustín
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c7, biz_diego, 'El pan de masa madre es el mejor de Huancayo, siempre compro aquí.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c7, biz_diego, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c4, biz_diego, 'Las empanadas son deliciosas y frescas cada mañana.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c4, biz_diego, 4);

    -- Estudio Contable Castro
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c8, biz_silvia, 'Asesoría contable muy clara y profesional, me ayudaron mucho.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c8, biz_silvia, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c5, biz_silvia, 'Buen servicio contable, precios justos para emprendedores.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c5, biz_silvia, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c2, biz_silvia, 'Me resolvieron todas mis dudas tributarias, muy agradecido.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c2, biz_silvia, 5);

    -- Vivero Los Andes
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c9, biz_miguel, 'Las plantas son de excelente calidad, el servicio de jardinería también.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c9, biz_miguel, 4);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c6, biz_miguel, 'Compré un frutal injertado y creció hermoso, muy recomendado.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c6, biz_miguel, 5);

    -- Moda Andina Boutique
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c10, biz_ana, 'El vestido andino es hermoso, la tela es de gran calidad.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c10, biz_ana, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c7, biz_ana, 'Diseños únicos, me encanta la fusión de tradición y moda.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c7, biz_ana, 5);
    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido) VALUES (uid_c4, biz_ana, 'La cartera artesanal es preciosa, todas me preguntan dónde la compré.');
    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion) VALUES (uid_c4, biz_ana, 5);
END $$;
