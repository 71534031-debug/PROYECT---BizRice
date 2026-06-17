/**
 * BIZRISE — Mi Negocio (Formulario de gestión)
 */

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
let categoriasMap = {};
let businessData = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('emprendedor')) return;

  await loadComponent('sidebar-container', '../../components/entrepreneur-sidebar/sidebar.html');

  await cargarCategorias();
  renderizarHorariosForm();
  await cargarMiNegocio();

  document.getElementById('business-form').addEventListener('submit', guardarNegocio);
  document.getElementById('btn-save-schedule').addEventListener('click', guardarHorarios);
  document.getElementById('btn-upload-image').addEventListener('click', subirImagen);

  document.getElementById('biz-nombre').addEventListener('input', actualizarPreview);
  document.getElementById('biz-categoria').addEventListener('change', actualizarPreview);
});

async function cargarCategorias() {
  try {
    const data = await apiGet('/categories');
    const select = document.getElementById('biz-categoria');
    data.items.forEach(cat => {
      categoriasMap[cat.id_categoria] = cat.nombre;
      const opt = document.createElement('option');
      opt.value = cat.id_categoria;
      opt.textContent = cat.nombre;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

function renderizarHorariosForm() {
  const tbody = document.getElementById('horarios-body');
  tbody.innerHTML = DIAS.map(dia => `
    <tr>
      <td class="fw-semibold">${dia}</td>
      <td>
        <input type="checkbox" class="form-check-input horario-check" data-dia="${dia}" checked>
      </td>
      <td>
        <input type="time" class="form-control form-control-sm horario-apertura" data-dia="${dia}" value="08:00">
      </td>
      <td>
        <input type="time" class="form-control form-control-sm horario-cierre" data-dia="${dia}" value="20:00">
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.horario-check').forEach(chk => {
    chk.addEventListener('change', function () {
      const dia = this.dataset.dia;
      document.querySelector(`.horario-apertura[data-dia="${dia}"]`).disabled = !this.checked;
      document.querySelector(`.horario-cierre[data-dia="${dia}"]`).disabled = !this.checked;
    });
  });
}

async function cargarMiNegocio() {
  try {
    const data = await apiGet('/entrepreneur/business');
    businessData = data;

    document.getElementById('no-business-alert').classList.add('d-none');

    document.getElementById('biz-nombre').value = data.nombre || '';
    document.getElementById('biz-categoria').value = data.id_categoria || '';
    document.getElementById('biz-descripcion').value = data.descripcion || '';
    document.getElementById('biz-telefono').value = data.telefono || '';
    document.getElementById('biz-distrito').value = data.distrito || '';
    document.getElementById('biz-direccion').value = data.direccion || '';

    setBizImage(document.getElementById('portada-preview'), data.imagen_portada_url, data.nombre);
    setBizImage(document.getElementById('preview-thumb'), data.imagen_portada_url, data.nombre);

    if (data.horarios) {
      data.horarios.forEach(h => {
        const dia = h.dia.charAt(0).toUpperCase() + h.dia.slice(1);
        document.querySelector(`.horario-check[data-dia="${dia}"]`).checked = h.abierto;
        if (h.apertura) document.querySelector(`.horario-apertura[data-dia="${dia}"]`).value = h.apertura.slice(0, 5);
        if (h.cierre) document.querySelector(`.horario-cierre[data-dia="${dia}"]`).value = h.cierre.slice(0, 5);
      });
    } else if (data.horario_apertura && data.horario_cierre) {
      document.querySelectorAll('.horario-apertura').forEach(inp => inp.value = data.horario_apertura.slice(0, 5));
      document.querySelectorAll('.horario-cierre').forEach(inp => inp.value = data.horario_cierre.slice(0, 5));
    }

    actualizarPreview();

  } catch (e) {
    if (e.message && e.message.includes('No tienes un negocio registrado')) {
      document.getElementById('no-business-alert').classList.remove('d-none');
    } else {
      console.error('Error cargando negocio:', e);
    }
  }
}

async function guardarNegocio(e) {
  e.preventDefault();

  const payload = {
    nombre: document.getElementById('biz-nombre').value.trim(),
    id_categoria: parseInt(document.getElementById('biz-categoria').value),
    descripcion: document.getElementById('biz-descripcion').value.trim(),
    telefono: document.getElementById('biz-telefono').value.trim(),
    distrito: document.getElementById('biz-distrito').value,
    direccion: document.getElementById('biz-direccion').value.trim()
  };

  if (!payload.nombre || !payload.id_categoria) {
    showToast('Nombre y categoría son obligatorios', 'warning');
    return;
  }

  const btn = document.getElementById('btn-save-business');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

  try {
    if (businessData) {
      await apiPut('/entrepreneur/business', payload);
      showToast('Negocio actualizado correctamente', 'success');
    } else {
      await apiPost('/entrepreneur/business', payload);
      showToast('Negocio registrado exitosamente', 'success');
      await cargarMiNegocio();
    }
  } catch (e) {
    showToast(e.message || 'Error al guardar', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar Cambios';
  }
}

async function guardarHorarios() {
  const horarios = DIAS.map(dia => ({
    dia: dia.toLowerCase(),
    abierto: document.querySelector(`.horario-check[data-dia="${dia}"]`).checked,
    apertura: document.querySelector(`.horario-apertura[data-dia="${dia}"]`).value,
    cierre: document.querySelector(`.horario-cierre[data-dia="${dia}"]`).value
  }));

  const btn = document.getElementById('btn-save-schedule');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

  try {
    await apiPut('/entrepreneur/business/schedule', { horarios });
    showToast('Horarios actualizados correctamente', 'success');
  } catch (e) {
    showToast(e.message || 'Error al guardar horarios', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar Horarios';
  }
}

async function subirImagen() {
  const fileInput = document.getElementById('portada-input');
  const file = fileInput.files[0];
  if (!file) {
    showToast('Selecciona una imagen primero', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('imagen', file);

  try {
    const data = await apiPostForm('/entrepreneur/business/image', formData);
    document.getElementById('portada-preview').src = data.imagen_url;
    document.getElementById('preview-thumb').src = data.imagen_url;
    showToast('Imagen subida correctamente', 'success');
    fileInput.value = '';
  } catch (e) {
    showToast(e.message || 'Error al subir imagen', 'danger');
  }
}

function actualizarPreview() {
  const nombre = document.getElementById('biz-nombre').value || 'Nombre del negocio';
  const catId = parseInt(document.getElementById('biz-categoria').value);
  const catName = categoriasMap[catId] || 'Categoría';

  document.getElementById('preview-nombre').textContent = nombre;
  document.getElementById('preview-categoria').textContent = catName;
}
