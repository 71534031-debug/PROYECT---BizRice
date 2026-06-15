-- ============================================================================
-- BIZRISE — Procedimientos Almacenados para SQL Server 2019+
-- ============================================================================
-- Este archivo contiene todos los SPs del sistema BizRise, reemplazando
-- las queries ORM directas de SQLAlchemy.
--
-- Base de datos: BizRiseDB
-- Driver: ODBC Driver 17 for SQL Server
-- ============================================================================

USE BizRiseDB;
GO

-- ============================================================================
-- USUARIOS
-- ============================================================================

-- Registrar un nuevo usuario (emprendedor por defecto)
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @nombre VARCHAR(100),
    @apellido VARCHAR(100),
    @correo VARCHAR(150),
    @contrasena_hash VARCHAR(255),
    @rol VARCHAR(20) = 'emprendedor'
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar que el correo no exista
    IF EXISTS (SELECT 1 FROM Usuarios WHERE correo = @correo)
    BEGIN
        RAISERROR('El correo ya está registrado', 16, 1);
        RETURN;
    END;

    INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol)
    VALUES (@nombre, @apellido, @correo, @contrasena_hash, @rol);

    SELECT
        id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro
    FROM Usuarios
    WHERE id_usuario = SCOPE_IDENTITY();
END;
GO

-- Obtener usuario por correo (login)
CREATE OR ALTER PROCEDURE sp_GetUserByEmail
    @correo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_usuario, nombre, apellido, correo, contrasena_hash, rol, estado, avatar_url, fecha_registro
    FROM Usuarios
    WHERE correo = @correo;
END;
GO

-- Obtener usuario por ID
CREATE OR ALTER PROCEDURE sp_GetUserById
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro
    FROM Usuarios
    WHERE id_usuario = @id_usuario;
END;
GO

-- Actualizar estado de usuario (activar/suspender/desactivar)
CREATE OR ALTER PROCEDURE sp_UpdateUserStatus
    @id_usuario INT,
    @estado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id_usuario = @id_usuario)
    BEGIN
        RAISERROR('Usuario no encontrado', 16, 1);
        RETURN;
    END;

    IF @estado NOT IN ('activo', 'inactivo', 'suspendido')
    BEGIN
        RAISERROR('Estado no válido. Use: activo, inactivo, suspendido', 16, 1);
        RETURN;
    END;

    UPDATE Usuarios SET estado = @estado WHERE id_usuario = @id_usuario;

    SELECT
        id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro
    FROM Usuarios
    WHERE id_usuario = @id_usuario;
END;
GO

-- Cambiar contraseña
CREATE OR ALTER PROCEDURE sp_ChangePassword
    @id_usuario INT,
    @contrasena_hash_nueva VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id_usuario = @id_usuario)
    BEGIN
        RAISERROR('Usuario no encontrado', 16, 1);
        RETURN;
    END;

    UPDATE Usuarios SET contrasena_hash = @contrasena_hash_nueva
    WHERE id_usuario = @id_usuario;

    SELECT 'Contraseña actualizada exitosamente' AS mensaje;
END;
GO

-- ============================================================================
-- EMPRENDIMIENTOS (NEGOCIOS)
-- ============================================================================

-- Listar emprendimientos públicos con filtros, ordenamiento y paginación
CREATE OR ALTER PROCEDURE sp_GetBusinesses
    @busqueda VARCHAR(150) = NULL,
    @id_categoria INT = NULL,
    @distrito VARCHAR(100) = NULL,
    @orden VARCHAR(20) = 'reciente',
    @page INT = 1,
    @size INT = 12
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = (@page - 1) * @size;

    -- Tabla temporal con datos filtrados
    CREATE TABLE #resultados (
        id_emprendimiento INT,
        nombre VARCHAR(150),
        descripcion VARCHAR(MAX),
        telefono VARCHAR(20),
        direccion VARCHAR(255),
        distrito VARCHAR(100),
        horario_apertura TIME,
        horario_cierre TIME,
        imagen_portada_url VARCHAR(255),
        estado_verificacion VARCHAR(20),
        fecha_registro DATETIME,
        id_categoria INT,
        nombre_categoria VARCHAR(100),
        nombre_propietario VARCHAR(100),
        apellido_propietario VARCHAR(100),
        puntuacion_promedio DECIMAL(3,1),
        total_valoraciones INT
    );

    INSERT INTO #resultados
    SELECT
        e.id_emprendimiento,
        e.nombre,
        CAST(e.descripcion AS VARCHAR(MAX)) AS descripcion,
        e.telefono,
        e.direccion,
        e.distrito,
        e.horario_apertura,
        e.horario_cierre,
        e.imagen_portada_url,
        e.estado_verificacion,
        e.fecha_registro,
        e.id_categoria,
        c.nombre AS nombre_categoria,
        u.nombre AS nombre_propietario,
        u.apellido AS apellido_propietario,
        ISNULL(ROUND(AVG(CAST(v.puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion_promedio,
        COUNT(v.id_valoracion) AS total_valoraciones
    FROM Emprendimientos e
    INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
    INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
    WHERE e.estado_verificacion = 'aprobado'
      AND (
        @busqueda IS NULL OR @busqueda = ''
        OR e.nombre LIKE '%' + @busqueda + '%'
        OR CAST(e.descripcion AS VARCHAR(MAX)) LIKE '%' + @busqueda + '%'
      )
      AND (@id_categoria IS NULL OR e.id_categoria = @id_categoria)
      AND (@distrito IS NULL OR @distrito = '' OR e.distrito = @distrito)
    GROUP BY
        e.id_emprendimiento, e.nombre, CAST(e.descripcion AS VARCHAR(MAX)), e.telefono, e.direccion, e.distrito,
        e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
        e.fecha_registro, e.id_categoria, c.nombre, u.nombre, u.apellido;

    -- Total de resultados (para paginación)
    DECLARE @total INT = (SELECT COUNT(*) FROM #resultados);

    -- Seleccionar página según orden
    IF @orden = 'valoracion'
        SELECT *, @total AS total, @page AS page, @size AS size,
               CEILING(CAST(@total AS DECIMAL) / NULLIF(@size, 0)) AS pages
        FROM #resultados
        ORDER BY puntuacion_promedio DESC, total_valoraciones DESC
        OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
    ELSE IF @orden = 'nombre'
        SELECT *, @total AS total, @page AS page, @size AS size,
               CEILING(CAST(@total AS DECIMAL) / NULLIF(@size, 0)) AS pages
        FROM #resultados
        ORDER BY nombre ASC
        OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
    ELSE -- 'reciente' por defecto
        SELECT *, @total AS total, @page AS page, @size AS size,
               CEILING(CAST(@total AS DECIMAL) / NULLIF(@size, 0)) AS pages
        FROM #resultados
        ORDER BY fecha_registro DESC
        OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;

    DROP TABLE #resultados;
END;
GO

-- Obtener detalle completo de un emprendimiento
CREATE OR ALTER PROCEDURE sp_GetBusinessById
    @id_emprendimiento INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Información del emprendimiento
    SELECT
        e.id_emprendimiento,
        e.nombre,
        CAST(e.descripcion AS VARCHAR(MAX)) AS descripcion,
        e.telefono,
        e.direccion,
        e.distrito,
        e.horario_apertura,
        e.horario_cierre,
        e.imagen_portada_url,
        e.estado_verificacion,
        e.fecha_registro,
        e.id_categoria,
        c.nombre AS nombre_categoria,
        u.id_usuario,
        u.nombre AS nombre_propietario,
        u.apellido AS apellido_propietario,
        ISNULL(ROUND(AVG(CAST(v.puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion_promedio,
        COUNT(v.id_valoracion) AS total_valoraciones
    FROM Emprendimientos e
    INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
    INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
    WHERE e.id_emprendimiento = @id_emprendimiento
      AND e.estado_verificacion = 'aprobado'
    GROUP BY
        e.id_emprendimiento, e.nombre, CAST(e.descripcion AS VARCHAR(MAX)), e.telefono, e.direccion, e.distrito,
        e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
        e.fecha_registro, e.id_categoria, c.nombre, u.id_usuario, u.nombre, u.apellido;

    -- Redes sociales del emprendimiento
    SELECT id_red, plataforma, url
    FROM RedesSociales
    WHERE id_emprendimiento = @id_emprendimiento;

    -- Promociones activas
    SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado
    FROM Promociones
    WHERE id_emprendimiento = @id_emprendimiento
      AND estado = 'activa'
    ORDER BY fecha_inicio DESC;
END;
GO

-- Crear un nuevo emprendimiento
CREATE OR ALTER PROCEDURE sp_CreateBusiness
    @id_usuario INT,
    @id_categoria INT,
    @nombre VARCHAR(150),
    @descripcion TEXT = NULL,
    @telefono VARCHAR(20) = NULL,
    @direccion VARCHAR(255) = NULL,
    @distrito VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar que el usuario no tenga ya un negocio
    IF EXISTS (SELECT 1 FROM Emprendimientos WHERE id_usuario = @id_usuario)
    BEGIN
        RAISERROR('El usuario ya tiene un negocio registrado', 16, 1);
        RETURN;
    END;

    -- Verificar que la categoría exista
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id_categoria = @id_categoria)
    BEGIN
        RAISERROR('Categoría no encontrada', 16, 1);
        RETURN;
    END;

    INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito)
    VALUES (@id_usuario, @id_categoria, @nombre, @descripcion, @telefono, @direccion, @distrito);

    SELECT
        e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
        e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
        e.id_categoria, c.nombre AS nombre_categoria
    FROM Emprendimientos e
    INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
    WHERE e.id_emprendimiento = SCOPE_IDENTITY();
END;
GO

-- Actualizar datos de un emprendimiento (solo el propietario)
CREATE OR ALTER PROCEDURE sp_UpdateBusiness
    @id_emprendimiento INT,
    @id_usuario INT,
    @nombre VARCHAR(150) = NULL,
    @id_categoria INT = NULL,
    @descripcion TEXT = NULL,
    @telefono VARCHAR(20) = NULL,
    @direccion VARCHAR(255) = NULL,
    @distrito VARCHAR(100) = NULL,
    @horario_apertura TIME = NULL,
    @horario_cierre TIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar que el emprendimiento exista y pertenezca al usuario
    IF NOT EXISTS (SELECT 1 FROM Emprendimientos WHERE id_emprendimiento = @id_emprendimiento AND id_usuario = @id_usuario)
    BEGIN
        RAISERROR('Emprendimiento no encontrado o no autorizado', 16, 1);
        RETURN;
    END;

    UPDATE Emprendimientos
    SET
        nombre = ISNULL(@nombre, nombre),
        id_categoria = ISNULL(@id_categoria, id_categoria),
        descripcion = ISNULL(@descripcion, descripcion),
        telefono = ISNULL(@telefono, telefono),
        direccion = ISNULL(@direccion, direccion),
        distrito = ISNULL(@distrito, distrito),
        horario_apertura = ISNULL(@horario_apertura, horario_apertura),
        horario_cierre = ISNULL(@horario_cierre, horario_cierre)
    WHERE id_emprendimiento = @id_emprendimiento;

    SELECT 'Negocio actualizado correctamente' AS mensaje;
END;
GO

-- Actualizar estado de verificación de un emprendimiento (solo admin)
CREATE OR ALTER PROCEDURE sp_UpdateBusinessStatus
    @id_emprendimiento INT,
    @estado VARCHAR(20),
    @motivo VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Emprendimientos WHERE id_emprendimiento = @id_emprendimiento)
    BEGIN
        RAISERROR('Emprendimiento no encontrado', 16, 1);
        RETURN;
    END;

    IF @estado NOT IN ('pendiente', 'aprobado', 'rechazado')
    BEGIN
        RAISERROR('Estado no válido. Use: pendiente, aprobado, rechazado', 16, 1);
        RETURN;
    END;

    UPDATE Emprendimientos
    SET estado_verificacion = @estado
    WHERE id_emprendimiento = @id_emprendimiento;

    SELECT e.id_emprendimiento, e.nombre, e.estado_verificacion,
           @motivo AS motivo_rechazo
    FROM Emprendimientos e
    WHERE e.id_emprendimiento = @id_emprendimiento;
END;
GO

-- Obtener emprendimiento por ID de usuario (para el panel emprendedor)
CREATE OR ALTER PROCEDURE sp_GetBusinessByUserId
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.id_emprendimiento, e.nombre, CAST(e.descripcion AS VARCHAR(MAX)) AS descripcion, e.telefono, e.direccion, e.distrito,
        e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
        e.id_categoria, c.nombre AS nombre_categoria,
        ISNULL(ROUND(AVG(CAST(v.puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion_promedio,
        COUNT(v.id_valoracion) AS total_valoraciones
    FROM Emprendimientos e
    INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
    LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
    WHERE e.id_usuario = @id_usuario
    GROUP BY
        e.id_emprendimiento, e.nombre, CAST(e.descripcion AS VARCHAR(MAX)), e.telefono, e.direccion, e.distrito,
        e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
        e.fecha_registro, e.id_categoria, c.nombre;

    -- Redes sociales
    SELECT id_red, plataforma, url
    FROM RedesSociales
    WHERE id_emprendimiento IN (SELECT id_emprendimiento FROM Emprendimientos WHERE id_usuario = @id_usuario);
END;
GO

-- ============================================================================
-- PRODUCTOS
-- ============================================================================

-- Listar productos activos de un emprendimiento
CREATE OR ALTER PROCEDURE sp_GetProductsByBusiness
    @id_emprendimiento INT,
    @page INT = 1,
    @size INT = 20,
    @busqueda VARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = (@page - 1) * @size;

    SELECT
        @size AS size, @page AS page,
        COUNT(*) OVER() AS total,
        CEILING(CAST(COUNT(*) OVER() AS DECIMAL) / NULLIF(@size, 0)) AS pages,
        id_producto, nombre, CAST(descripcion AS VARCHAR(MAX)) AS descripcion, precio, imagen_url, estado_stock, activo, fecha_creacion
    FROM Productos
    WHERE id_emprendimiento = @id_emprendimiento
      AND activo = 1
      AND (@busqueda IS NULL OR nombre LIKE '%' + @busqueda + '%')
    ORDER BY fecha_creacion DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
END;
GO

-- Crear un producto
CREATE OR ALTER PROCEDURE sp_CreateProduct
    @id_emprendimiento INT,
    @nombre VARCHAR(150),
    @descripcion TEXT = NULL,
    @precio DECIMAL(10,2) = NULL,
    @imagen_url VARCHAR(255) = NULL,
    @stock INT = 0,
    @estado_stock VARCHAR(20) = 'disponible'
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar límite de 50 productos activos
    IF (SELECT COUNT(*) FROM Productos WHERE id_emprendimiento = @id_emprendimiento AND activo = 1) >= 50
    BEGIN
        RAISERROR('Máximo 50 productos por emprendimiento', 16, 1);
        RETURN;
    END;

    IF @estado_stock NOT IN ('disponible', 'bajo_stock', 'agotado')
        SET @estado_stock = 'disponible';

    INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, imagen_url, stock, estado_stock)
    VALUES (@id_emprendimiento, @nombre, @descripcion, @precio, @imagen_url, @stock, @estado_stock);

    SELECT
        id_producto, nombre, CAST(descripcion AS VARCHAR(MAX)) AS descripcion, precio, imagen_url, estado_stock, activo, fecha_creacion
    FROM Productos
    WHERE id_producto = SCOPE_IDENTITY();
END;
GO

-- Actualizar un producto
CREATE OR ALTER PROCEDURE sp_UpdateProduct
    @id_producto INT,
    @id_emprendimiento INT,
    @nombre VARCHAR(150) = NULL,
    @descripcion TEXT = NULL,
    @precio DECIMAL(10,2) = NULL,
    @imagen_url VARCHAR(255) = NULL,
    @stock INT = NULL,
    @estado_stock VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar que el producto exista y pertenezca al emprendimiento
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_producto = @id_producto AND id_emprendimiento = @id_emprendimiento)
    BEGIN
        RAISERROR('Producto no encontrado', 16, 1);
        RETURN;
    END;

    UPDATE Productos
    SET
        nombre = ISNULL(@nombre, nombre),
        descripcion = ISNULL(@descripcion, descripcion),
        precio = ISNULL(@precio, precio),
        imagen_url = ISNULL(@imagen_url, imagen_url),
        stock = ISNULL(@stock, stock),
        estado_stock = ISNULL(@estado_stock, estado_stock)
    WHERE id_producto = @id_producto AND id_emprendimiento = @id_emprendimiento;

    SELECT
        id_producto, nombre, CAST(descripcion AS VARCHAR(MAX)) AS descripcion, precio, imagen_url, estado_stock, activo, fecha_creacion
    FROM Productos
    WHERE id_producto = @id_producto;
END;
GO

-- Eliminar producto (soft delete: activo = 0)
CREATE OR ALTER PROCEDURE sp_DeleteProduct
    @id_producto INT,
    @id_emprendimiento INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_producto = @id_producto AND id_emprendimiento = @id_emprendimiento)
    BEGIN
        RAISERROR('Producto no encontrado', 16, 1);
        RETURN;
    END;

    UPDATE Productos SET activo = 0
    WHERE id_producto = @id_producto AND id_emprendimiento = @id_emprendimiento;

    SELECT 'Producto eliminado' AS mensaje;
END;
GO

-- ============================================================================
-- CATEGORÍAS
-- ============================================================================

-- Listar todas las categorías con conteo de emprendimientos aprobados
CREATE OR ALTER PROCEDURE sp_GetCategories
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id_categoria, c.nombre, c.descripcion, c.icono_url,
        COUNT(e.id_emprendimiento) AS total_emprendimientos
    FROM Categorias c
    LEFT JOIN Emprendimientos e ON c.id_categoria = e.id_categoria AND e.estado_verificacion = 'aprobado'
    GROUP BY c.id_categoria, c.nombre, c.descripcion, c.icono_url
    ORDER BY c.nombre ASC;
END;
GO

-- ============================================================================
-- VALORACIONES Y COMENTARIOS
-- ============================================================================

-- Listar reseñas (comentarios + valoraciones) de un emprendimiento
CREATE OR ALTER PROCEDURE sp_GetReviewsByBusiness
    @id_emprendimiento INT,
    @page INT = 1,
    @size INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = (@page - 1) * @size;

    -- Distribución de estrellas (para mostrar en frontend)
    SELECT
        v.puntuacion AS estrella,
        COUNT(*) AS cantidad
    FROM Valoraciones v
    WHERE v.id_emprendimiento = @id_emprendimiento
    GROUP BY v.puntuacion
    ORDER BY v.puntuacion DESC;

    -- Reseñas paginadas con información del usuario
    SELECT
        @size AS size, @page AS page,
        COUNT(*) OVER() AS total,
        CEILING(CAST(COUNT(*) OVER() AS DECIMAL) / NULLIF(@size, 0)) AS pages,
        c.id_comentario, CAST(c.contenido AS VARCHAR(MAX)) AS contenido, c.util_count, c.fecha,
        v.puntuacion,
        u.id_usuario, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.avatar_url
    FROM Comentarios c
    INNER JOIN Usuarios u ON c.id_usuario = u.id_usuario
    INNER JOIN Valoraciones v ON c.id_usuario = v.id_usuario AND c.id_emprendimiento = v.id_emprendimiento
    WHERE c.id_emprendimiento = @id_emprendimiento
    ORDER BY c.fecha DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;

    -- Puntuación promedio
    SELECT
        ISNULL(ROUND(AVG(CAST(puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion_promedio,
        COUNT(*) AS total_valoraciones
    FROM Valoraciones
    WHERE id_emprendimiento = @id_emprendimiento;
END;
GO

-- Crear reseña (comentario + valoración combinados)
CREATE OR ALTER PROCEDURE sp_CreateReview
    @id_usuario INT,
    @id_emprendimiento INT,
    @contenido TEXT,
    @puntuacion TINYINT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar puntuación
    IF @puntuacion < 1 OR @puntuacion > 5
    BEGIN
        RAISERROR('La puntuación debe estar entre 1 y 5', 16, 1);
        RETURN;
    END;

    -- Validar contenido mínimo
    IF LEN(CAST(@contenido AS VARCHAR(MAX))) < 10
    BEGIN
        RAISERROR('El comentario debe tener al menos 10 caracteres', 16, 1);
        RETURN;
    END;

    -- Verificar que el usuario no haya reseñado antes
    IF EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = @id_usuario AND id_emprendimiento = @id_emprendimiento)
    BEGIN
        RAISERROR('Ya dejaste una reseña en este emprendimiento', 16, 1);
        RETURN;
    END;

    BEGIN TRANSACTION;

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido)
    VALUES (@id_usuario, @id_emprendimiento, @contenido);

    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion)
    VALUES (@id_usuario, @id_emprendimiento, @puntuacion);

    COMMIT TRANSACTION;

    SELECT 'Reseña publicada exitosamente' AS mensaje;
END;
GO

-- Obtener distribución de estrellas y puntuación promedio
CREATE OR ALTER PROCEDURE sp_GetRatingDistribution
    @id_emprendimiento INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ISNULL(ROUND(AVG(CAST(puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion_promedio,
        COUNT(*) AS total_valoraciones
    FROM Valoraciones
    WHERE id_emprendimiento = @id_emprendimiento;

    SELECT
        v.puntuacion AS estrella,
        COUNT(*) AS cantidad
    FROM Valoraciones v
    WHERE v.id_emprendimiento = @id_emprendimiento
    GROUP BY v.puntuacion
    ORDER BY v.puntuacion DESC;
END;
GO

-- ============================================================================
-- PROMOCIONES
-- ============================================================================

-- Listar promociones de un emprendimiento (con auto-vencimiento)
CREATE OR ALTER PROCEDURE sp_GetPromotionsByBusiness
    @id_emprendimiento INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Auto-vencer promociones cuya fecha_fin ya pasó
    UPDATE Promociones
    SET estado = 'vencida'
    WHERE id_emprendimiento = @id_emprendimiento
      AND estado = 'activa'
      AND fecha_fin IS NOT NULL
      AND fecha_fin < CAST(GETDATE() AS DATE);

    SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado
    FROM Promociones
    WHERE id_emprendimiento = @id_emprendimiento
    ORDER BY ISNULL(fecha_inicio, '1900-01-01') DESC;
END;
GO

-- Crear una promoción
CREATE OR ALTER PROCEDURE sp_CreatePromotion
    @id_emprendimiento INT,
    @titulo VARCHAR(150),
    @descripcion TEXT = NULL,
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL,
    @estado VARCHAR(20) = 'activa'
AS
BEGIN
    SET NOCOUNT ON;

    -- Límite de 10 promociones activas
    IF @estado = 'activa'
    BEGIN
        IF (SELECT COUNT(*) FROM Promociones WHERE id_emprendimiento = @id_emprendimiento AND estado = 'activa') >= 10
        BEGIN
            RAISERROR('Máximo 10 promociones activas simultáneas', 16, 1);
            RETURN;
        END;
    END;

    IF @estado NOT IN ('activa', 'vencida', 'borrador')
        SET @estado = 'activa';

    INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado)
    VALUES (@id_emprendimiento, @titulo, @descripcion, @fecha_inicio, @fecha_fin, @estado);

    SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado
    FROM Promociones
    WHERE id_promocion = SCOPE_IDENTITY();
END;
GO

-- Actualizar una promoción
CREATE OR ALTER PROCEDURE sp_UpdatePromotion
    @id_promocion INT,
    @id_emprendimiento INT,
    @titulo VARCHAR(150) = NULL,
    @descripcion TEXT = NULL,
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL,
    @estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Promociones WHERE id_promocion = @id_promocion AND id_emprendimiento = @id_emprendimiento)
    BEGIN
        RAISERROR('Promoción no encontrada', 16, 1);
        RETURN;
    END;

    UPDATE Promociones
    SET
        titulo = ISNULL(@titulo, titulo),
        descripcion = ISNULL(@descripcion, descripcion),
        fecha_inicio = ISNULL(@fecha_inicio, fecha_inicio),
        fecha_fin = ISNULL(@fecha_fin, fecha_fin),
        estado = ISNULL(@estado, estado)
    WHERE id_promocion = @id_promocion AND id_emprendimiento = @id_emprendimiento;

    SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado
    FROM Promociones
    WHERE id_promocion = @id_promocion;
END;
GO

-- Eliminar una promoción (borrado físico)
CREATE OR ALTER PROCEDURE sp_DeletePromotion
    @id_promocion INT,
    @id_emprendimiento INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Promociones WHERE id_promocion = @id_promocion AND id_emprendimiento = @id_emprendimiento)
    BEGIN
        RAISERROR('Promoción no encontrada', 16, 1);
        RETURN;
    END;

    DELETE FROM Promociones WHERE id_promocion = @id_promocion AND id_emprendimiento = @id_emprendimiento;

    SELECT 'Promoción eliminada' AS mensaje;
END;
GO

-- ============================================================================
-- ADMINISTRADOR
-- ============================================================================

-- Estadísticas generales del dashboard admin
CREATE OR ALTER PROCEDURE sp_GetAdminStats
AS
BEGIN
    SET NOCOUNT ON;

    -- Totales generales
    SELECT
        (SELECT COUNT(*) FROM Usuarios) AS total_usuarios,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'emprendedor') AS total_emprendedores,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'cliente') AS total_clientes,
        (SELECT COUNT(*) FROM Emprendimientos) AS total_emprendimientos,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'aprobado') AS emprendimientos_aprobados,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'pendiente') AS emprendimientos_pendientes,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'rechazado') AS emprendimientos_rechazados,
        (SELECT COUNT(*) FROM Productos WHERE activo = 1) AS total_productos_activos,
        (SELECT COUNT(*) FROM Categorias) AS total_categorias,
        (SELECT COUNT(*) FROM Comentarios) AS total_comentarios,
        (SELECT COUNT(*) FROM Valoraciones) AS total_valoraciones;

    -- Usuarios registrados en los últimos 7 días
    SELECT
        CAST(fecha_registro AS DATE) AS fecha,
        COUNT(*) AS cantidad
    FROM Usuarios
    WHERE fecha_registro >= DATEADD(DAY, -7, GETDATE())
    GROUP BY CAST(fecha_registro AS DATE)
    ORDER BY fecha ASC;

    -- Últimas solicitudes de verificación pendientes
    SELECT TOP 10
        e.id_emprendimiento, e.nombre, e.fecha_registro,
        u.nombre AS propietario_nombre, u.apellido AS propietario_apellido, u.correo
    FROM Emprendimientos e
    INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
    WHERE e.estado_verificacion = 'pendiente'
    ORDER BY e.fecha_registro ASC;

    -- Top 5 emprendimientos mejor valorados
    SELECT TOP 5
        e.id_emprendimiento, e.nombre,
        ISNULL(ROUND(AVG(CAST(v.puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion,
        COUNT(v.id_valoracion) AS total_resenas
    FROM Emprendimientos e
    LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
    WHERE e.estado_verificacion = 'aprobado'
    GROUP BY e.id_emprendimiento, e.nombre
    HAVING COUNT(v.id_valoracion) > 0
    ORDER BY puntuacion DESC, total_resenas DESC;
END;
GO

-- Listar todos los usuarios (admin)
CREATE OR ALTER PROCEDURE sp_GetAllUsers
    @page INT = 1,
    @size INT = 20,
    @busqueda VARCHAR(150) = NULL,
    @rol VARCHAR(20) = NULL,
    @estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = (@page - 1) * @size;

    SELECT
        @size AS size, @page AS page,
        COUNT(*) OVER() AS total,
        CEILING(CAST(COUNT(*) OVER() AS DECIMAL) / NULLIF(@size, 0)) AS pages,
        id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro
    FROM Usuarios
    WHERE (@busqueda IS NULL OR nombre LIKE '%' + @busqueda + '%' OR apellido LIKE '%' + @busqueda + '%' OR correo LIKE '%' + @busqueda + '%')
      AND (@rol IS NULL OR rol = @rol)
      AND (@estado IS NULL OR estado = @estado)
    ORDER BY fecha_registro DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
END;
GO

-- Listar todos los emprendimientos con detalles (admin)
CREATE OR ALTER PROCEDURE sp_GetAllBusinessesAdmin
    @page INT = 1,
    @size INT = 20,
    @busqueda VARCHAR(150) = NULL,
    @estado VARCHAR(20) = NULL,
    @id_categoria INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = (@page - 1) * @size;

    SELECT
        @size AS size, @page AS page,
        COUNT(*) OVER() AS total,
        CEILING(CAST(COUNT(*) OVER() AS DECIMAL) / NULLIF(@size, 0)) AS pages,
        e.id_emprendimiento, e.nombre, CAST(e.descripcion AS VARCHAR(MAX)) AS descripcion, e.telefono, e.direccion, e.distrito,
        e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
        e.id_categoria, c.nombre AS nombre_categoria,
        u.id_usuario, u.nombre AS propietario_nombre, u.apellido AS propietario_apellido, u.correo AS propietario_correo,
        ISNULL(ROUND(AVG(CAST(v.puntuacion AS DECIMAL(3,1))), 1), 0) AS puntuacion_promedio,
        COUNT(v.id_valoracion) AS total_valoraciones
    FROM Emprendimientos e
    INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
    INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
    WHERE (@busqueda IS NULL OR e.nombre LIKE '%' + @busqueda + '%' OR u.nombre LIKE '%' + @busqueda + '%' OR u.correo LIKE '%' + @busqueda + '%')
      AND (@estado IS NULL OR e.estado_verificacion = @estado)
      AND (@id_categoria IS NULL OR e.id_categoria = @id_categoria)
    GROUP BY
        e.id_emprendimiento, e.nombre, CAST(e.descripcion AS VARCHAR(MAX)), e.telefono, e.direccion, e.distrito,
        e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
        e.id_categoria, c.nombre, u.id_usuario, u.nombre, u.apellido, u.correo
    ORDER BY e.fecha_registro DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
END;
GO

-- ============================================================================
-- VENTAS (opcional — complemento para reportes)
-- ============================================================================

-- Obtener ventas de un emprendimiento
CREATE OR ALTER PROCEDURE sp_GetSalesByBusiness
    @id_emprendimiento INT,
    @page INT = 1,
    @size INT = 20,
    @estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = (@page - 1) * @size;

    SELECT
        @size AS size, @page AS page,
        COUNT(*) OVER() AS total,
        CEILING(CAST(COUNT(*) OVER() AS DECIMAL) / NULLIF(@size, 0)) AS pages,
        v.id_venta, v.total, v.estado, v.fecha_creacion,
        u.id_usuario, u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
    FROM Ventas v
    INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
    WHERE v.id_emprendimiento = @id_emprendimiento
      AND (@estado IS NULL OR v.estado = @estado)
    ORDER BY v.fecha_creacion DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
END;
GO

PRINT '>> Todos los procedimientos almacenados de BizRise se crearon correctamente.';
GO
