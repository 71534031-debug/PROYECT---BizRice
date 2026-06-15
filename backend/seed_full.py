"""
Seed masivo con datos semireales peruanos para BizRise.
Ejecutar: python seed_full.py
Requiere base de datos creada con schema.sql.
"""
import sys
import os
from datetime import datetime, timedelta, date, timezone
import random

sys.path.insert(0, os.path.dirname(__file__))
# Usar las credenciales del archivo .env — NO sobrescribir DB_PASSWORD
os.environ.setdefault("SECRET_KEY", "seed-dev-key-not-for-production")
os.environ.setdefault("ALLOWED_ORIGINS", "*")

from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload
from src.config.db import SessionLocal, engine, Base
from src.models.user import Usuario
from src.models.category import Categoria
from src.models.business import Emprendimiento
from src.models.product import Producto
from src.models.review import Comentario
from src.models.rating import Valoracion
from src.models.promotion import Promocion
from src.models.social_network import RedSocial
from src.models.sale import Venta, DetalleVenta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD_COMMON = pwd_context.hash("BizRise2024!")
PASSWORD_ADMIN = pwd_context.hash("Admin123!")
PASSWORD_EMPRENDEDOR = pwd_context.hash("Emprendedor1!")
PASSWORD_CLIENTE = pwd_context.hash("Cliente1!")

# ─── DATOS PERUANOS REALISTAS ─────────────────────────────────────────────

NOMBRES = [
    "Carlos", "María", "José", "Ana", "Luis", "Carmen", "Juan", "Rosa",
    "Miguel", "Elena", "Jorge", "Patricia", "Víctor", "Sofía", "Raúl",
    "Diana", "Pedro", "Gabriela", "Fernando", "Isabel", "Pablo", "Mónica",
    "Diego", "Verónica", "Alberto", "Lorena", "Manuel", "Claudia", "Ricardo",
    "Andrea", "Hugo", "Silvia", "Oscar", "Paola", "Eduardo", "Ruth",
    "Marco", "Natalia", "Javier", "Marina", "Ángel", "Rocío", "Iván", "Teresa"
]

APELLIDOS = [
    "Quispe", "Huamán", "Condori", "Mamani", "Flores", "García", "Rodríguez",
    "Martínez", "López", "González", "Vargas", "Castillo", "Ramos", "Torres",
    "Ramírez", "Cruz", "Chávez", "Rojas", "Díaz", "Soto", "Salazar", "Ortega",
    "Medina", "Reyes", "Córdova", "Paredes", "Gutiérrez", "Contreras", "Campos",
    "Vega", "Zevallos", "Montoya", "Ortiz", "Herrera", "Peña", "Cárdenas",
    "Mendoza", "Aguilar", "Navarro", "Tello", "Pacheco", "Solano", "Vilchez",
    "Espinoza"
]

DISTRITOS_HUANCAYO = [
    "Huancayo", "El Tambo", "Chilca", "San Agustín", "Sicaya", "Pilcomayo",
    "San Jerónimo de Tunán", "Quilcas", "Saño", "Hualhuas", "Viques",
    "San Pedro de Saño"
]

EMPRENDIMIENTOS = [
    {
        "nombre": "Tejidos Andinos Huancayo",
        "descripcion": "Artesanía textil tradicional de la sierra central, ponchos, chompas y accesorios hechos a mano con lana de alpaca. Cada pieza es única y elaborada por artesanas locales.",
        "telefono": "964 123 456",
        "direccion": "Jr. Cusco 345",
        "distrito": "Huancayo",
        "categoria": "Artesanía",
        "horario_apertura": "08:00", "horario_cierre": "19:00"
    },
    {
        "nombre": "Café de Altura Valle del Mantaro",
        "descripcion": "Café artesanal 100% peruano cultivado en las laderas del Valle del Mantaro. Ofrecemos granos seleccionados, café molido y experiencias de cata.",
        "telefono": "964 234 567",
        "direccion": "Av. Giráldez 567",
        "distrito": "El Tambo",
        "categoria": "Gastronomía",
        "horario_apertura": "07:00", "horario_cierre": "22:00"
    },
    {
        "nombre": "Moda Oversize Huanca",
        "descripcion": "Ropa moderna oversize con diseños urbanos inspirados en la cultura huanca. Polos, buzos y casacas con estampados originales.",
        "telefono": "964 345 678",
        "direccion": "Calle Real 890",
        "distrito": "Huancayo",
        "categoria": "Textilería y Moda",
        "horario_apertura": "09:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Sabores del Valle",
        "descripcion": "Comida típica huancaína, pachamanca, cuy chactado, papa a la huancaína y más. Ingredientes frescos de la región.",
        "telefono": "964 456 789",
        "direccion": "Av. Ferrocarril 234",
        "distrito": "Chilca",
        "categoria": "Gastronomía",
        "horario_apertura": "08:00", "horario_cierre": "23:00"
    },
    {
        "nombre": "Soluciones Tech Perú",
        "descripcion": "Desarrollo de software, páginas web, aplicaciones móviles y soluciones digitales para emprendedores y pequeñas empresas en Huancayo.",
        "telefono": "964 567 890",
        "direccion": "Jr. Ayacucho 456",
        "distrito": "Huancayo",
        "categoria": "Tecnología",
        "horario_apertura": "09:00", "horario_cierre": "18:00"
    },
    {
        "nombre": "NaturaVida",
        "descripcion": "Productos naturales y orgánicos, suplementos vitamínicos, jabones artesanales y cosmética natural elaborada con insumos de la región.",
        "telefono": "964 678 901",
        "direccion": "Av. Panamericana 123",
        "distrito": "El Tambo",
        "categoria": "Belleza",
        "horario_apertura": "08:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Cerámica Huanca",
        "descripcion": "Cerámica artesanal tradicional, vajillas, adornos y piezas decorativas pintadas a mano con motivos andinos contemporáneos.",
        "telefono": "964 789 012",
        "direccion": "Calle Lima 678",
        "distrito": "San Jerónimo de Tunán",
        "categoria": "Artesanía",
        "horario_apertura": "08:00", "horario_cierre": "18:00"
    },
    {
        "nombre": "Belleza Natural Spa",
        "descripcion": "Centro de estética y bienestar, tratamientos faciales, masajes relajantes, manicure y pedicure con productos naturales.",
        "telefono": "964 890 123",
        "direccion": "Av. Mariscal Castilla 2345",
        "distrito": "Huancayo",
        "categoria": "Belleza",
        "horario_apertura": "09:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Plaza Fitness Gym",
        "descripcion": "Gimnasio moderno con equipos de última generación, clases dirigidas, crossfit y entrenamiento personalizado en Huancayo.",
        "telefono": "964 901 234",
        "direccion": "Jr. Puno 345",
        "distrito": "El Tambo",
        "categoria": "Servicios",
        "horario_apertura": "06:00", "horario_cierre": "22:00"
    },
    {
        "nombre": "Muebles Rústicos del Centro",
        "descripcion": "Muebles artesanales de madera, muebles rústicos, decoración para el hogar y muebles a medida con madera de la región.",
        "telefono": "964 012 345",
        "direccion": "Av. Centenario 1234",
        "distrito": "Chilca",
        "categoria": "Artesanía",
        "horario_apertura": "08:00", "horario_cierre": "19:00"
    },
    {
        "nombre": "Dulces Huancaínos",
        "descripcion": "Repostería tradicional huancaína, alfajores, manjar blanco, turrones, queques y postres típicos. Productos frescos diariamente.",
        "telefono": "965 123 456",
        "direccion": "Jr. Arequipa 567",
        "distrito": "Huancayo",
        "categoria": "Gastronomía",
        "horario_apertura": "07:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Foto Estudio Andino",
        "descripcion": "Servicios de fotografía profesional, sesiones de estudio, fotografía de eventos, bodas y quinceañeros. Edición profesional.",
        "telefono": "965 234 567",
        "direccion": "Calle Real 789",
        "distrito": "Huancayo",
        "categoria": "Servicios",
        "horario_apertura": "09:00", "horario_cierre": "19:00"
    },
    {
        "nombre": "AgroAndes Perú",
        "descripcion": "Venta de productos agrícolas frescos, frutas, verduras y hortalizas orgánicas cultivadas en el Valle del Mantaro. Envíos a domicilio.",
        "telefono": "965 345 678",
        "direccion": "Av. Independencia 456",
        "distrito": "El Tambo",
        "categoria": "Agricultura",
        "horario_apertura": "06:00", "horario_cierre": "18:00"
    },
    {
        "nombre": "Boutique Elegance",
        "descripcion": "Ropa femenina de moda, vestidos, blusas, faldas y accesorios importados. Asesoría de imagen personalizada.",
        "telefono": "965 456 789",
        "direccion": "Calle Real 123",
        "distrito": "Huancayo",
        "categoria": "Textilería y Moda",
        "horario_apertura": "10:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Lavandería Eco Clean",
        "descripcion": "Servicio de lavandería profesional, limpieza en seco, lavado de prendas delicadas. Servicio recogida y entrega a domicilio.",
        "telefono": "965 567 890",
        "direccion": "Jr. Puno 789",
        "distrito": "Chilca",
        "categoria": "Servicios",
        "horario_apertura": "07:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Tech Repairs Huancayo",
        "descripcion": "Reparación de computadoras, laptops y celulares. Venta de accesorios tecnológicos, laptops y equipos de cómputo.",
        "telefono": "965 678 901",
        "direccion": "Av. Giráldez 890",
        "distrito": "Huancayo",
        "categoria": "Tecnología",
        "horario_apertura": "09:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Cerveza Artesanal Wanka",
        "descripcion": "Cerveza artesanal de la región, variedades: rubia, negra, roja y de temporada. Visitas guiadas a la fábrica y degustaciones.",
        "telefono": "965 789 012",
        "direccion": "Calle Puno 1234",
        "distrito": "El Tambo",
        "categoria": "Gastronomía",
        "horario_apertura": "10:00", "horario_cierre": "22:00"
    },
    {
        "nombre": "Centro Veterinario San Francisco",
        "descripcion": "Atención veterinaria, consultas, cirugías, vacunación, peluquería canina y venta de accesorios para mascotas.",
        "telefono": "965 890 123",
        "direccion": "Av. Huancavelica 567",
        "distrito": "Huancayo",
        "categoria": "Servicios",
        "horario_apertura": "08:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Gimnasio Wanka Fit",
        "descripcion": "Gimnasio con máquinas de musculación, cardio, clases grupales de yoga, pilates y spinning. Programas de descuento.",
        "telefono": "965 901 234",
        "direccion": "Av. Centenario 890",
        "distrito": "El Tambo",
        "categoria": "Servicios",
        "horario_apertura": "06:00", "horario_cierre": "23:00"
    },
    {
        "nombre": "Turismo Wanka Expediciones",
        "descripcion": "Agencia de turismo local, tours al Valle del Mantaro, Torre Torre, Huaytapallana y circuitos gastronómicos.",
        "telefono": "965 012 345",
        "direccion": "Calle Real 456",
        "distrito": "Huancayo",
        "categoria": "Turismo",
        "horario_apertura": "08:00", "horario_cierre": "19:00"
    },
    {
        "nombre": "Panadería San Martín",
        "descripcion": "Pan artesanal, pastelería fina, tortas personalizadas para eventos. Pan de maíz, pan integral y especialidades de la zona.",
        "telefono": "966 123 456",
        "direccion": "Jr. Junín 234",
        "distrito": "Chilca",
        "categoria": "Gastronomía",
        "horario_apertura": "05:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Decora Hogar",
        "descripcion": "Artículos de decoración para el hogar, cortinas, cojines, cuadros, lámparas, alfombras y accesorios. Diseño de interiores.",
        "telefono": "966 234 567",
        "direccion": "Av. Mariscal Castilla 3456",
        "distrito": "Huancayo",
        "categoria": "Hogar",
        "horario_apertura": "09:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Clínica Dental Huancayo",
        "descripcion": "Servicios odontológicos generales y especializados, ortodoncia, implantes, blanqueamiento dental. Atención con cita previa.",
        "telefono": "966 345 678",
        "direccion": "Av. Independencia 789",
        "distrito": "Huancayo",
        "categoria": "Servicios",
        "horario_apertura": "08:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Repostería Delicias Huanca",
        "descripcion": "Pastelería y repostería fina, postres tradicionales, tortas decoradas, cupcakes y galletas artesanales.",
        "telefono": "966 456 789",
        "direccion": "Jr. Cusco 678",
        "distrito": "El Tambo",
        "categoria": "Gastronomía",
        "horario_apertura": "07:00", "horario_cierre": "20:00"
    },
    {
        "nombre": "Librería y Papelería El Estudiante",
        "descripcion": "Venta de libros, cuadernos, útiles escolares y de oficina. Fotocopias, impresiones y servicios de librería.",
        "telefono": "966 567 890",
        "direccion": "Calle Real 234",
        "distrito": "Huancayo",
        "categoria": "Servicios",
        "horario_apertura": "07:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Bazar y Regalos Mil Colores",
        "descripcion": "Tienda de regalos, souvenirs, artículos de temporada, juguetes y accesorios. Encuentra el regalo perfecto.",
        "telefono": "966 678 901",
        "direccion": "Av. Ferrocarril 567",
        "distrito": "Chilca",
        "categoria": "Artesanía",
        "horario_apertura": "09:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Estudio de Tattoo Ink Wanka",
        "descripcion": "Estudio de tatuajes profesionales, diseños personalizados, cover up, piercing. Artistas con experiencia. Higiene garantizada.",
        "telefono": "966 789 012",
        "direccion": "Jr. Ayacucho 789",
        "distrito": "Huancayo",
        "categoria": "Servicios",
        "horario_apertura": "10:00", "horario_cierre": "21:00"
    },
    {
        "nombre": "Vivero Jardines del Valle",
        "descripcion": "Venta de plantas ornamentales, flores, árboles frutales, sustratos, macetas y asesoría en jardinería.",
        "telefono": "966 890 123",
        "direccion": "Av. Panamericana 2345",
        "distrito": "Huancayo",
        "categoria": "Agricultura",
        "horario_apertura": "07:00", "horario_cierre": "18:00"
    },
    {
        "nombre": "Helados Artesanales Huanca",
        "descripcion": "Helados artesanales de sabores peruanos: lúcuma, aguaymanto, chirimoya, maracuyá. También smoothies y batidos.",
        "telefono": "966 901 234",
        "direccion": "Av. Giráldez 123",
        "distrito": "El Tambo",
        "categoria": "Gastronomía",
        "horario_apertura": "10:00", "horario_cierre": "22:00"
    },
    {
        "nombre": "Centro de Idiomas Speak Easy",
        "descripcion": "Cursos de inglés y portugués, preparación para exámenes internacionales. Clases presenciales y online.",
        "telefono": "966 012 345",
        "direccion": "Calle Real 567",
        "distrito": "Huancayo",
        "categoria": "Servicios",
        "horario_apertura": "08:00", "horario_cierre": "21:00"
    },
]

CATEGORIAS = [
    {"nombre": "Gastronomía", "descripcion": "Restaurantes, cafeterías y comida típica"},
    {"nombre": "Textilería y Moda", "descripcion": "Ropa, telas, confecciones y accesorios"},
    {"nombre": "Artesanía", "descripcion": "Productos artesanales y arte tradicional"},
    {"nombre": "Servicios", "descripcion": "Servicios profesionales y personales"},
    {"nombre": "Turismo", "descripcion": "Agencias y experiencias turísticas"},
    {"nombre": "Tecnología", "descripcion": "Soluciones digitales y desarrollo"},
    {"nombre": "Belleza", "descripcion": "Cuidado personal, estética y cosmética"},
    {"nombre": "Agricultura", "descripcion": "Productos agrícolas y derivados"},
    {"nombre": "Hogar", "descripcion": "Decoración, muebles y artículos para el hogar"},
]

PRODUCTOS_POR_CATEGORIA = {
    "Gastronomía": [
        ("Café de Altura Huancayo 500g", "Café 100% peruano molido, bolsa de 500 gramos", 28.00),
        ("Papa a la Huancaína Kit", "Kit para preparar papa a la huancaña en casa, incluye todos los ingredientes", 35.00),
        ("Alfajores Artesanales x6", "Alfajores artesanales con manjar blanco, paquete de 6", 18.00),
        ("Chocolate Peruano 70% 200g", "Chocolate bitter 70% cacao, tableta de 200 gramos", 22.00),
        ("Miel de Abeja Orgánica 500ml", "Miel pura de abeja de la sierra central", 25.00),
        ("Queso Fresco Huanca 1kg", "Queso fresco artesanal, kilo", 18.00),
        ("Cerveza Artesanal Rubia x6", "Pack 6 botellas de cerveza artesanal variedad rubia", 45.00),
        ("Pan de Maíz Integral x10", "Pan de maíz integral horneado al día, paquete 10 unidades", 12.00),
        ("Dulce de Aguaymanto 400g", "Mermelada de aguaymanto artesanal", 16.00),
        ("Macadamia Tostada 200g", "Macadamias tostadas bolsa de 200 gramos", 25.00),
        ("Hierbas Aromáticas Mix", "Mix de hierbas aromáticas de la región", 10.00),
        ("Chocoteja Artesanal x3", "Chocotejas artesanales de pecanas y manjar", 15.00),
    ],
    "Textilería y Moda": [
        ("Polo Algodón Wanka", "Polo de algodón peinado con diseño Wanka", 39.00),
        ("Chompa de Alpaca", "Chompa tejida a mano con lana de alpaca", 120.00),
        ("Buzo Oversize Huanca", "Buzo oversize con capucha, diseño urbano", 65.00),
        ("Vestido Floreado Primavera", "Vestido estampado con motivos florales", 55.00),
        ("Casaca Impermeable Viajero", "Casaca ligera impermeable para actividades al aire libre", 89.00),
        ("Gorro Chullo Artesanal", "Gorro tradicional chullo tejido a mano", 35.00),
        ("Bufanda de Alpaca", "Bufanda suave de lana de alpaca", 45.00),
        ("Medias de Lana x3", "Medias de lana de oveja, pack de 3 pares", 25.00),
        ("Pantalón Cargo Urbano", "Pantalón cargo con múltiples bolsillos", 75.00),
        ("Chalina de Colores Andinos", "Chalina tejida con patrones geométricos andinos", 55.00),
        ("Guantes de Alpaca", "Guantes térmicos de lana de alpaca", 30.00),
        ("Mochila Tejida Artesanal", "Mochila tradicional tejida a mano", 68.00),
    ],
    "Artesanía": [
        ("Jarrón de Cerámica Pintado a Mano", "Jarrón decorativo de cerámica con motivos andinos", 65.00),
        ("Set de Tazas Artesanales x4", "Cuatro tazas de cerámica pintadas a mano", 55.00),
        ("Plato Decorativo Sol Andino", "Plato decorativo de cerámica con diseño del Inti", 35.00),
        ("Portavasos de Madera x6", "Portavasos artesanales de madera tallada", 20.00),
        ("Llavero Tejido Andino", "Llavero artesanal tejido con diseños tradicionales", 10.00),
        ("Máscara Decorativa de Diablada", "Máscara decorativa inspirada en la diablada", 85.00),
        ("Cojín Bordado a Mano", "Cojín decorativo con bordados florales", 45.00),
        ("Canasta de Mimbre Mediana", "Canasta tejida de mimbre, uso decorativo", 38.00),
        ("Retablo Ayacuchano Mini", "Mini retablo artesanal, escena andina", 70.00),
        ("Poncho de Lana de Oveja", "Poncho tradicional de lana de oveja", 95.00),
        ("Tapiz Andino Decorativo", "Tapiz mural tejido a mano con escenas del Valle", 120.00),
        ("Mates Burilados", "Mate burilado artesanal con paisajes andinos", 40.00),
    ],
    "Servicios": [
        ("Sesión de Fotos Profesional", "Sesión fotográfica de 2 horas, 30 fotos editadas", 150.00),
        ("Diseño de Logo", "Diseño de identidad visual básica: logo y paleta de colores", 200.00),
        ("Lavado de Auto Completo", "Lavado exterior e interior, aspirado y encerado", 35.00),
        ("Clase de Inglés Grupal x4", "4 clases grupales de inglés nivel básico", 80.00),
        ("Membresía Mensual Gimnasio", "Acceso ilimitado al gimnasio por un mes", 89.00),
        ("Consulta Veterinaria General", "Consulta general para mascotas, incluye revisión", 40.00),
        ("Limpieza Dental Profesional", "Limpieza dental con ultrasonido y fluorización", 80.00),
        ("Reparación de Laptop", "Diagnóstico y reparación de laptops, incluye mano de obra", 60.00),
        ("Tatuaje Personalizado 10cm", "Tatuaje personalizado de hasta 10 centímetros", 180.00),
        ("Asesoría Contable Mensual", "Asesoría contable básica para emprendedores", 120.00),
    ],
    "Tecnología": [
        ("Laptop Lenovo ThinkPad", "Laptop Lenovo ThinkPad i5, 8GB, 256GB SSD", 1899.00),
        ("Mouse Inalámbrico Slim", "Mouse inalámbrico slim, silencioso", 35.00),
        ("Teclado Mecánico RGB", "Teclado mecánico retroiluminado RGB", 120.00),
        ("Audífonos Bluetooth", "Audífonos inalámbricos, cancelación de ruido", 95.00),
        ("Cable USB-C Carga Rápida", "Cable USB-C a USB-A, 2 metros, carga rápida", 18.00),
        ("Hub USB 4 Puertos", "Hub USB 3.0 de 4 puertos", 35.00),
        ("Webcam HD 1080p", "Cámara web HD con micrófono integrado", 75.00),
        ("Mochila para Laptop 15.6\"", "Mochila acolchada para laptops de hasta 15.6\"", 65.00),
        ("Soporte Ajustable para Laptop", "Soporte metálico ajustable para escritorio", 45.00),
        ("Disco Duro Externo 1TB", "Disco duro externo portátil 1TB USB 3.0", 180.00),
    ],
    "Belleza": [
        ("Jabón Artesanal de Alpaca", "Jabón artesanal con leche de alpaca y miel", 12.00),
        ("Crema Hidratante Natural", "Crema hidratante con manteca de cacao y aloe vera", 28.00),
        ("Shampoo Sólido Orgánico", "Shampoo sólido con aceites esenciales", 22.00),
        ("Perfume Andino 50ml", "Perfume con notas de flor de la puna", 65.00),
        ("Mascarilla Facial Arcilla", "Mascarilla facial de arcilla andina", 18.00),
        ("Aceite Corporal de Maca", "Aceite corporal con extracto de maca", 30.00),
        ("Exfoliante de Café Orgánico", "Exfoliante corporal de café orgánico molido", 20.00),
        ("Bálsamo Labial Natural", "Bálsamo labial con manteca de cacao", 8.00),
    ],
    "Turismo": [
        ("Tour Valle del Mantaro Full Day", "Tour completo por el Valle del Mantaro, almuerzo incluido", 120.00),
        ("Excursión Torre Torre", "Caminata guiada a las formaciones de Torre Torre", 45.00),
        ("Tour Gastronómico Huancayo", "Recorrido por los mejores restaurantes típicos", 90.00),
        ("Ruta de la Artesanía", "Visita a talleres artesanales de la zona", 55.00),
        ("Caminata Huaytapallana", "Excursión al nevado Huaytapallana, full day", 150.00),
        ("City Tour Huancayo", "Recorrido por los principales atractivos de la ciudad", 35.00),
    ],
    "Agricultura": [
        ("Mermelada de Aguaymanto", "Mermelada artesanal de aguaymanto, fruto andino", 15.00),
        ("Quinua Orgánica 1kg", "Quinua real orgánica bolsa de 1 kilogramo", 12.00),
        ("Kiwicha 500g", "Kiwicha tostada bolsa de 500 gramos", 10.00),
        ("Maca en Polvo 400g", "Maca gelatinizada en polvo, bolsa de 400 gramos", 18.00),
        ("Granos de Café Verde 1kg", "Café verde sin tostar para tostar en casa", 25.00),
        ("Cacao Nativo 250g", "Cacao criollo nativo en granos, 250 gramos", 22.00),
    ],
    "Hogar": [
        ("Set de Sábanas King Size", "Sábanas de algodón egipcio, 4 piezas, king size", 180.00),
        ("Cortina Blackout Gris", "Cortina blackout 2x2 metros, color gris", 65.00),
        ("Lámpara de Mesa Moderna", "Lámpara LED de escritorio con brazo ajustable", 55.00),
        ("Cojín Decorativo 45x45", "Cojín decorativo con funda removible", 30.00),
        ("Cuadro Decorativo 60x40", "Cuadro decorativo con impresión de paisajes andinos", 45.00),
        ("Alfombra Tejida 1.5x2m", "Alfombra tejida a mano con lana de oveja", 120.00),
        ("Organizador de Escritorio", "Organizador de escritorio de bambú", 28.00),
        ("Portarretratos Familiar x3", "Set de 3 portarretratos de madera", 25.00),
    ],
}

# ─── HELPERS ───────────────────────────────────────────────────────────────

def random_date(start_year=2023, end_year=2025):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days, hours=random.randint(0,23), minutes=random.randint(0,59))

def random_date_2024_2025():
    start = datetime(2024, 1, 1)
    end = datetime(2025, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days, hours=random.randint(0,23), minutes=random.randint(0,59))

def weighted_choice(items, weights):
    total = sum(weights)
    r = random.uniform(0, total)
    upto = 0
    for item, weight in zip(items, weights):
        upto += weight
        if r <= upto:
            return item
    return items[-1]

# ─── MAIN ──────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        # Verificar si ya hay datos
        if db.query(Usuario).count() > 5:
            print("⚠️  La BD ya tiene datos. Omitiendo seed (usa seed_full.py --force para forzar).")
            if "--force" not in sys.argv:
                return
            print("▶️  Forzando seed...")

        print("🚀 Iniciando seed masivo de BizRise...")
        print("=" * 50)

        # ─── CATEGORÍAS ─────────────────────────────────────────────────
        print("\n📁 Creando categorías...")
        categorias_map = {}
        for cat_data in CATEGORIAS:
            cat = Categoria(nombre=cat_data["nombre"], descripcion=cat_data["descripcion"])
            db.add(cat)
            db.flush()
            categorias_map[cat.nombre] = cat.id_categoria
        db.commit()
        print(f"   ✅ {len(CATEGORIAS)} categorías creadas")

        # ─── USUARIOS ───────────────────────────────────────────────────
        print("\n👥 Creando usuarios...")
        random.seed(42)

        used_names = set()
        users = []
        emails_used = set()

        # Admin demo — contraseña: Admin123!
        admin_user = Usuario(
            nombre="Jorge", apellido="Anccasi",
            correo="admin@bizrise.pe",
            contrasena_hash=PASSWORD_ADMIN,
            rol="administrador", estado="activo",
            fecha_registro=datetime(2024, 1, 15)
        )
        db.add(admin_user)
        db.flush()
        users.append(admin_user)
        emails_used.add("admin@bizrise.pe")

        admin2 = Usuario(
            nombre="Carmen", apellido="García",
            correo="carmen.garcia@bizrise.pe",
            contrasena_hash=PASSWORD_COMMON,
            rol="administrador", estado="activo",
            fecha_registro=datetime(2024, 2, 1)
        )
        db.add(admin2)
        db.flush()
        users.append(admin2)
        emails_used.add("carmen.garcia@bizrise.pe")

        # Cliente demo — contraseña: Cliente1!
        cliente_demo = Usuario(
            nombre="Lucía", apellido="Mendoza",
            correo="cliente@bizrise.pe",
            contrasena_hash=PASSWORD_CLIENTE,
            rol="cliente", estado="activo",
            fecha_registro=datetime(2024, 3, 1)
        )
        db.add(cliente_demo)
        db.flush()
        users.append(cliente_demo)
        emails_used.add("cliente@bizrise.pe")

        # Emprendedor demo — contraseña: Emprendedor1!
        emprendedor_demo = Usuario(
            nombre="Pedro", apellido="Huamán",
            correo="emprendedor@bizrise.pe",
            contrasena_hash=PASSWORD_EMPRENDEDOR,
            rol="emprendedor", estado="activo",
            fecha_registro=datetime(2024, 3, 15)
        )
        db.add(emprendedor_demo)
        db.flush()
        users.append(emprendedor_demo)
        emails_used.add("emprendedor@bizrise.pe")

        # Generar 36 usuarios adicionales (total ~40)
        ROLES = ["cliente", "cliente", "cliente", "cliente", "cliente", "emprendedor", "emprendedor", "cliente"]
        num_extra = 36
        for i in range(num_extra):
            while True:
                nombre = random.choice(NOMBRES)
                apellido = random.choice(APELLIDOS)
                nombre_completo = f"{nombre} {apellido}"
                if nombre_completo not in used_names:
                    used_names.add(nombre_completo)
                    break

            email = f"{nombre.lower()}.{apellido.lower()}{random.randint(1,99)}@gmail.com"
            while email in emails_used:
                email = f"{nombre.lower()}.{apellido.lower()}{random.randint(100,999)}@gmail.com"
            emails_used.add(email)

            rol = weighted_choice(
                ["cliente", "emprendedor"],
                [0.55, 0.40]
            )

            user = Usuario(
                nombre=nombre, apellido=apellido,
                correo=email,
                contrasena_hash=PASSWORD_COMMON,
                rol=rol,
                estado="activo",
                fecha_registro=random_date(2024, 2025)
            )
            db.add(user)
            db.flush()
            users.append(user)

        db.commit()
        print(f"   ✅ {len(users)} usuarios creados (2 admins, {sum(1 for u in users if u.rol=='emprendedor')} emprendedores, {sum(1 for u in users if u.rol=='cliente')} clientes)")

        # ─── EMPRENDIMIENTOS ──────────────────────────────────────────
        print("\n🏪 Creando emprendimientos...")
        emprendedores = [u for u in users if u.rol == "emprendedor"]
        negocios_creados = []

        random.shuffle(emprendedores)

        for i, emp_data in enumerate(EMPRENDIMIENTOS):
            if i >= len(emprendedores):
                break
            user = emprendedores[i]
            cat_id = categorias_map.get(emp_data["categoria"], 1)

            apertura = datetime.strptime(emp_data["horario_apertura"], "%H:%M").time()
            cierre = datetime.strptime(emp_data["horario_cierre"], "%H:%M").time()

            emp = Emprendimiento(
                id_usuario=user.id_usuario,
                id_categoria=cat_id,
                nombre=emp_data["nombre"],
                descripcion=emp_data["descripcion"],
                telefono=emp_data["telefono"],
                direccion=emp_data["direccion"],
                distrito=emp_data["distrito"],
                horario_apertura=apertura,
                horario_cierre=cierre,
                estado_verificacion=random.choices(
                    ["aprobado", "pendiente", "rechazado"],
                    weights=[0.75, 0.15, 0.10]
                )[0],
                fecha_registro=random_date(2024, 2025)
            )
            db.add(emp)
            db.flush()
            negocios_creados.append(emp)

        db.commit()
        print(f"   ✅ {len(negocios_creados)} emprendimientos creados")

        # ─── REDES SOCIALES ────────────────────────────────────────────
        print("\n🌐 Creando redes sociales...")
        PLATAFORMAS = ["facebook", "instagram", "whatsapp", "web", "tiktok"]
        redes_count = 0
        for emp in negocios_creados:
            num_redes = random.randint(1, 3)
            selected = random.sample(PLATAFORMAS, num_redes)
            for plataforma in selected:
                slug = emp.nombre.lower().replace(" ", "").replace("ñ", "n")[:20]
                if plataforma == "facebook":
                    url = f"https://facebook.com/{slug}"
                elif plataforma == "instagram":
                    url = f"https://instagram.com/@{slug}"
                elif plataforma == "whatsapp":
                    url = f"https://wa.me/51{emp.telefono.replace(' ','').replace('-','')}"
                elif plataforma == "tiktok":
                    url = f"https://tiktok.com/@{slug}"
                else:
                    url = f"https://{slug}.bizrise.pe"
                red = RedSocial(
                    id_emprendimiento=emp.id_emprendimiento,
                    plataforma=plataforma,
                    url=url
                )
                db.add(red)
                redes_count += 1
        db.commit()
        print(f"   ✅ {redes_count} redes sociales creadas")

        # ─── PRODUCTOS ─────────────────────────────────────────────────
        print("\n📦 Creando productos...")
        productos_creados = []
        for emp in negocios_creados:
            cat_name = next(c["nombre"] for c in CATEGORIAS if c["nombre"] ==
                          db.query(Categoria).filter(Categoria.id_categoria == emp.id_categoria).first().nombre)
            productos_pool = PRODUCTOS_POR_CATEGORIA.get(cat_name, [])

            if not productos_pool:
                productos_pool = PRODUCTOS_POR_CATEGORIA.get("Artesanía", [])

            num_productos = min(random.randint(4, len(productos_pool)), 8)
            selected = random.sample(productos_pool, num_productos)

            for nombre_prod, desc_prod, precio in selected:
                stock_qty = random.choices(
                    [random.randint(10, 200), random.randint(1, 9), 0],
                    weights=[0.75, 0.15, 0.10]
                )[0]
                stock_status = "disponible" if stock_qty > 10 else ("bajo_stock" if stock_qty > 0 else "agotado")
                prod = Producto(
                    id_emprendimiento=emp.id_emprendimiento,
                    nombre=nombre_prod,
                    descripcion=desc_prod,
                    precio=precio,
                    stock=stock_qty,
                    estado_stock=stock_status,
                    activo=True,
                    fecha_creacion=random_date(2024, 2025)
                )
                db.add(prod)
                db.flush()
                productos_creados.append(prod)

        db.commit()
        print(f"   ✅ {len(productos_creados)} productos creados")

        # ─── PROMOCIONES ───────────────────────────────────────────────
        print("\n🏷️  Creando promociones...")
        promos_count = 0
        for emp in negocios_creados:
            if random.random() < 0.6:
                num_promos = random.randint(1, 2)
                for _ in range(num_promos):
                    fec_inicio = random_date(2025, 2025)
                    fec_fin = fec_inicio + timedelta(days=random.randint(7, 45))
                    promo = Promocion(
                        id_emprendimiento=emp.id_emprendimiento,
                        titulo=random.choice([
                            "Descuento por inauguración",
                            "Oferta especial fin de semana",
                            "2x1 en productos seleccionados",
                            "10% de descuento en tu primera compra",
                            "Promoción del mes",
                            "Envío gratis a toda la ciudad",
                            "Compra 3 lleva 4",
                            "Descuento corporativo"
                        ]),
                        descripcion="Aprovecha esta promoción válida por tiempo limitado.",
                        fecha_inicio=fec_inicio,
                        fecha_fin=fec_fin,
                        estado=random.choice(["activa", "activa", "vencida"])
                    )
                    db.add(promo)
                    promos_count += 1
        db.commit()
        print(f"   ✅ {promos_count} promociones creadas")

        # ─── VALORACIONES Y COMENTARIOS ────────────────────────────────
        print("\n⭐ Creando valoraciones y comentarios...")
        clientes = [u for u in users if u.rol == "cliente"]
        valoraciones_count = 0
        comentarios_count = 0

        for emp in negocios_creados:
            num_reviews = random.randint(2, 6)
            reviewers = random.sample(clientes, min(num_reviews, len(clientes)))
            for reviewer in reviewers:
                puntuacion = weighted_choice(
                    [5, 4, 3, 2, 1],
                    [0.40, 0.30, 0.15, 0.10, 0.05]
                )

                valoracion = Valoracion(
                    id_usuario=reviewer.id_usuario,
                    id_emprendimiento=emp.id_emprendimiento,
                    puntuacion=puntuacion,
                    fecha=random_date(2024, 2025)
                )
                db.add(valoracion)
                valoraciones_count += 1

                if random.random() < 0.7:
                    comentarios_textos = {
                        5: [
                            f"Excelente servicio, muy recomendado. Volveré sin duda.",
                            f"Me encantó todo, la atención fue increíble.",
                            f"Muy buenos productos, calidad superior.",
                            f"El mejor emprendimiento de Huancayo, sigan así.",
                            f"Quedé muy satisfecho con la compra, 10/10.",
                            "Atención de primera, productos de gran calidad.",
                        ],
                        4: [
                            "Muy buena atención, solo mejorar el tiempo de entrega.",
                            "Buenos productos, precios justos. Recomendado.",
                            "Me gustó mucho, volveré a comprar.",
                            "Casi todo perfecto, un detalle mínimo que mejorar.",
                        ],
                        3: [
                            "Estuvo bien, esperaba un poco más.",
                            "Podría mejorar, pero en general es aceptable.",
                            "Productos regulares, atención buena.",
                            "Cumple con lo básico, nada extraordinario.",
                        ],
                        2: [
                            "No me gustó mucho, la atención fue lenta.",
                            "Regular, esperaba mejor calidad.",
                            "Los precios son altos para lo que ofrecen.",
                        ],
                        1: [
                            "Mala experiencia, no recomiendo.",
                            "Decepcionado, el producto no era lo esperado.",
                        ]
                    }
                    textos = comentarios_textos.get(puntuacion, comentarios_textos[3])
                    contenido = random.choice(textos)

                    comentario = Comentario(
                        id_usuario=reviewer.id_usuario,
                        id_emprendimiento=emp.id_emprendimiento,
                        contenido=contenido,
                        util_count=random.randint(0, 8),
                        fecha=random_date(2024, 2025)
                    )
                    db.add(comentario)
                    comentarios_count += 1

        db.commit()
        print(f"   ✅ {valoraciones_count} valoraciones y {comentarios_count} comentarios creados")

        # ─── VENTAS ────────────────────────────────────────────────────
        print("\n🧾 Creando ventas...")
        ventas_count = 0
        detalle_count = 0
        ESTADOS_VENTA = ["entregado", "entregado", "entregado", "pendiente", "cancelado"]
        clientes_list = [u for u in users if u.rol == "cliente"]
        approved_negocios = [emp for emp in negocios_creados if emp.estado_verificacion == "aprobado"]

        for _ in range(350):
            if not approved_negocios or not clientes_list:
                break

            emp = random.choice(approved_negocios)
            cliente = random.choice(clientes_list)
            estado = random.choice(ESTADOS_VENTA)

            productos_emp = [p for p in productos_creados if p.id_emprendimiento == emp.id_emprendimiento]
            if not productos_emp:
                continue

            num_items = random.randint(1, 4)
            items_venta = random.sample(productos_emp, min(num_items, len(productos_emp)))

            total = 0
            detalles_temp = []
            for prod in items_venta:
                cantidad = random.randint(1, 3)
                precio_unitario = float(prod.precio or 0)
                subtotal = round(precio_unitario * cantidad, 2)
                total += subtotal
                detalles_temp.append({
                    "id_producto": prod.id_producto,
                    "cantidad": cantidad,
                    "precio_unitario": precio_unitario,
                    "subtotal": subtotal
                })

            fecha_venta = random_date_2024_2025()

            venta = Venta(
                id_usuario=cliente.id_usuario,
                id_emprendimiento=emp.id_emprendimiento,
                total=round(total, 2),
                estado=estado,
                fecha_creacion=fecha_venta
            )
            db.add(venta)
            db.flush()

            for d in detalles_temp:
                dv = DetalleVenta(
                    id_venta=venta.id_venta,
                    id_producto=d["id_producto"],
                    cantidad=d["cantidad"],
                    precio_unitario=d["precio_unitario"],
                    subtotal=d["subtotal"]
                )
                db.add(dv)
                detalle_count += 1

            ventas_count += 1

        db.commit()
        print(f"   ✅ {ventas_count} ventas creadas con {detalle_count} detalles")

        # ─── RESUMEN ───────────────────────────────────────────────────
        print("\n" + "=" * 50)
        print("📊 RESUMEN DE CARGA:")
        print(f"   Usuarios:         {len(users)}")
        print(f"   Categorías:       {len(CATEGORIAS)}")
        print(f"   Emprendimientos: {len(negocios_creados)}")
        print(f"   Productos:        {len(productos_creados)}")
        print(f"   Redes Sociales:   {redes_count}")
        print(f"   Promociones:      {promos_count}")
        print(f"   Valoraciones:     {valoraciones_count}")
        print(f"   Comentarios:      {comentarios_count}")
        print(f"   Ventas:           {ventas_count} con {detalle_count} detalles")
        print("=" * 50)
        print("✅ Seed completado exitosamente.")
        print("🔑 Contraseñas de usuarios demo:")
        print("   admin@bizrise.pe    → Admin123!")
        print("   emprendedor@bizrise.pe → Emprendedor1!")
        print("   cliente@bizrise.pe   → Cliente1!")
        print("   (demás usuarios:       BizRise2024!)")

    except Exception as e:
        db.rollback()
        print(f"❌ Error durante el seed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
