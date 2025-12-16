# 💈 Barbería Hugo - Sistema de Reservas & Gestión

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)

> **Aplicación web completa para la gestión de citas de una barbería, con panel de administración en tiempo real y lógica de negocio personalizada.**

---

## 🔗 Demo en Vivo
👉 **[Ver el proyecto online aquí](https://barberiahugo.vercel.app/)**

---

## 💡 Sobre el Proyecto

Este proyecto nació de la necesidad de digitalizar la gestión de citas de un negocio local. El objetivo principal fue crear una solución **sin dependencias pesadas (frameworks)** para demostrar un dominio sólido de **JavaScript Vanilla (ES6+)** y la manipulación del DOM, integrando una base de datos NoSQL (Firebase) para la persistencia de datos.

El sistema resuelve problemas reales de negocio: solapamiento de citas, gestión de horarios de apertura irregulares y notificaciones al cliente.

## ✨ Características Principales

### 🧑‍💻 Para el Cliente (Frontend)
* **Diseño Responsive & UX:** Interfaz oscura ("Dark Mode"), animaciones suaves y navegación intuitiva.
* **Selector de Citas Inteligente:**
    * Visualización de huecos libres/ocupados en tiempo real.
    * Bloqueo automático de horas pasadas y días festivos.
    * Lógica de negocio: Turnos estrictos de 20 minutos.
* **Integración con Google Calendar:** Generación automática de enlaces para que el cliente guarde su cita.
* **Validaciones:** Comprobación de formato de teléfono (España), email y campos obligatorios antes de enviar.

### 🔐 Para el Negocio (Panel de Administración)
* **Agenda Visual Diaria:** Vista tipo "calendario" para ver la ocupación del día de un vistazo (Semáforo: Verde=Libre, Rojo=Ocupado).
* **Gestión CRUD:** Crear citas manuales (walk-ins), ver detalles y cancelar citas.
* **Caja Diaria:** Cálculo automático de la facturación estimada del día.
* **Navegación Rápida:** Cambio de fechas con swipe/clic para gestión ágil desde el móvil.
* **Seguridad Básica:** Acceso restringido mediante autenticación en sesión.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5 Semántico, CSS3 (Grid/Flexbox, Custom Properties), JavaScript (ES6 Modules).
* **Backend (BaaS):** Google Firebase (Firestore Database).
* **Control de Versiones:** Git & GitHub.
* **Despliegue:** Vercel.

---

## 🧠 Desafíos Técnicos y Aprendizaje

Durante el desarrollo, me enfoqué en resolver lógica compleja sin librerías externas:

1.  **El "Portero" de Horarios:** Implementé un algoritmo en JS que valida si el establecimiento está abierto basándose en reglas complejas (Lunes solo tarde, Martes-Viernes partido, Fines de semana cerrado).
2.  **Prevención de "Overbooking":** Uso de consultas asíncronas (`async/await`) a Firebase para verificar la disponibilidad del slot de tiempo exacto milisegundos antes de confirmar la reserva.
3.  **Agenda Dinámica:** Renderizado del DOM en base a datos: generar una grilla de horas (09:00 - 21:00) y cruzarla con los datos de Firebase para pintar el estado de cada hueco.