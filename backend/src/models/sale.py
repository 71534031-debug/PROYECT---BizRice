from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Venta(Base):
    __tablename__ = "Ventas"
    id_venta      = Column(Integer, primary_key=True, index=True)
    id_usuario    = Column(Integer, ForeignKey("Usuarios.id_usuario"), nullable=False)
    id_emprendimiento = Column(Integer, ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    total         = Column(Numeric(10,2), nullable=False, default=0)
    estado        = Column(String(20), nullable=False, default="pendiente")
    fecha_creacion = Column(DateTime, server_default=func.getdate())

    usuario        = relationship("Usuario", foreign_keys=[id_usuario])
    emprendimiento = relationship("Emprendimiento", foreign_keys=[id_emprendimiento])
    detalles       = relationship("DetalleVenta", back_populates="venta")


class DetalleVenta(Base):
    __tablename__ = "DetalleVentas"
    id_detalle    = Column(Integer, primary_key=True, index=True)
    id_venta      = Column(Integer, ForeignKey("Ventas.id_venta"), nullable=False)
    id_producto   = Column(Integer, ForeignKey("Productos.id_producto"), nullable=False)
    cantidad      = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Numeric(10,2), nullable=False)
    subtotal      = Column(Numeric(10,2), nullable=False)

    venta   = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", foreign_keys=[id_producto])
