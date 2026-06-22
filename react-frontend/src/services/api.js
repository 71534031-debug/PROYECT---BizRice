const API_URL = import.meta.env.VITE_API_URL;

export const getUsuarios = async () => {
  try {
    const res = await fetch(`${API_URL}/usuarios`);

    if (!res.ok) {
      throw new Error("Error al obtener usuarios");
    }

    return await res.json();
  } catch (error) {
    console.error("API error:", error);
    return [];
  }
};
