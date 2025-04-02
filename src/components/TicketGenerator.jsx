import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import ticketImage from "../img/ticket.png"; // Importa la imagen del ticket

function TicketGenerator() {
  const [people, setPeople] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    address: "", // Nuevo campo para la dirección
  });
  const [ticketNumber, setTicketNumber] = useState(50);
  const [editingIndex, setEditingIndex] = useState(null); // Índice de la fila en edición
  const [expandedRow, setExpandedRow] = useState(null); // Índice de la fila expandida
  const ticketRefs = useRef([]);

  // Recuperar datos de localStorage al cargar la aplicación
  useEffect(() => {
    const savedNumber = localStorage.getItem("ticketNumber");
    if (savedNumber && !isNaN(parseInt(savedNumber))) {
      setTicketNumber(parseInt(savedNumber));
    }
    const savedPeople = localStorage.getItem("people");
    if (savedPeople) {
      try {
        const parsedPeople = JSON.parse(savedPeople);
        const validatedPeople = parsedPeople.map((person) => ({
          ...person,
          createdAt: person.createdAt ? new Date(person.createdAt) : new Date(),
        }));
        setPeople(validatedPeople);
      } catch (error) {
        console.error("Error al parsear los datos de people:", error);
        setPeople([]);
      }
    }
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.toUpperCase() });
  };

  // Agregar una nueva persona a la lista
  const addPerson = () => {
    if (!formData.firstName || !formData.lastName || !formData.dni || !formData.phone || !formData.address) {
      alert("Por favor, llena todos los campos.");
      return;
    }
    if (!/^\d{8}$/.test(formData.dni)) {
      alert("El DNI debe tener 8 dígitos numéricos.");
      return;
    }
    if (!/^\d+$/.test(formData.phone)) {
      alert("El teléfono debe contener solo números.");
      return;
    }

    const newPerson = {
      ...formData,
      id: Date.now(),
      ticketNumber: ticketNumber.toString().padStart(3, "0"),
      createdAt: new Date(),
    };
    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);

    // Guardar en localStorage
    localStorage.setItem("people", JSON.stringify(updatedPeople));
    localStorage.setItem("ticketNumber", ticketNumber + 1);

    setTicketNumber(ticketNumber + 1);
    setFormData({ firstName: "", lastName: "", dni: "", phone: "", address: "" }); // Limpiar el campo de dirección
  };

  // Formatear fecha y hora
  const formatDateTime = (date) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return new Intl.DateTimeFormat("es-ES", options).format(date);
  };

  // Exportar a Excel
  const exportToExcel = () => {
    try {
      const dataForExcel = people.map((person) => ({
        Ticket: person.ticketNumber,
        Nombres: person.firstName,
        Apellidos: person.lastName,
        DNI: person.dni,
        Teléfono: person.phone,
        Dirección: person.address, // Incluir la dirección en el Excel
        "Fecha y Hora": formatDateTime(person.createdAt),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
      XLSX.writeFile(workbook, "tickets_generados.xlsx");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("Ocurrió un error al exportar los datos a Excel.");
    }
  };

  // Actualizar datos de una persona
  const updatePerson = (index, field, value) => {
    const updatedPeople = [...people];
    updatedPeople[index][field] = value.toUpperCase();
    setPeople(updatedPeople);

    // Guardar en localStorage
    localStorage.setItem("people", JSON.stringify(updatedPeople));
  };

  // Generar imagen del ticket
  const generateImage = async (index) => {
    try {
      if (ticketRefs.current[index]) {
        const canvas = await html2canvas(ticketRefs.current[index], { scale: 2 });
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `ticket-${people[index].ticketNumber}.png`;
        link.click();
      } else {
        console.error("Referencia al ticket no encontrada para el índice:", index);
      }
    } catch (error) {
      console.error("Error al generar la imagen del ticket:", error);
      alert("Ocurrió un error al generar el ticket.");
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      {/* Formulario para ingresar datos */}
      <div className="mb-4 w-full max-w-4xl flex justify-between">
        <div className="w-1/2 pr-4">
          <h2 className="text-xl font-bold mb-4">Formulario sorteo</h2>
          <input
            type="text"
            name="firstName"
            placeholder="Nombres"
            value={formData.firstName}
            onChange={handleChange}
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Apellidos"
            value={formData.lastName}
            onChange={handleChange}
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="dni"
            placeholder="DNI"
            value={formData.dni}
            onChange={handleChange}
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="address"
            placeholder="Dirección"
            value={formData.address}
            onChange={handleChange}
            className="p-2 border rounded m-2 w-full"
          />
          <button
            onClick={addPerson}
            className="mt-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer w-full"
          >
            Generar Ticket
          </button>
        </div>

        {/* Muestra los datos en tiempo real */}
        <div className="w-1/2 pl-4">
          <h2 className="text-xl font-bold mb-4">Datos Actuales</h2>
          <div className="p-4 border rounded bg-gray-100">
            <p className="text-gray-800 font-bold"><strong>Nombres:</strong> {formData.firstName}</p>
            <p className="text-gray-800 font-bold"><strong>Apellidos:</strong> {formData.lastName}</p>
            <p className="text-gray-800 font-bold"><strong>DNI:</strong> {formData.dni}</p>
            <p className="text-gray-800 font-bold"><strong>Teléfono:</strong> {formData.phone}</p>
            <p className="text-gray-800 font-bold"><strong>Dirección:</strong> {formData.address}</p>
          </div>
        </div>
      </div>

      {/* Lista de tickets generados */}
      <div className="w-full mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Listado de Tickets Generados</h2>
          <button
            onClick={exportToExcel}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded cursor-pointer"
          >
            Exportar a Excel
          </button>
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2">Ticket</th>
              <th className="border border-gray-300 p-2">Nombres</th>
              <th className="border border-gray-300 p-2">Apellidos</th>
              <th className="border border-gray-300 p-2">DNI</th>
              <th className="border border-gray-300 p-2">Teléfono</th>
              <th className="border border-gray-300 p-2">Dirección</th>
              <th className="border border-gray-300 p-2">Fecha y Hora</th>
              <th className="border border-gray-300 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person, index) => (
              <>
                <tr key={person.id} className="text-center">
                  <td className="border border-gray-300 p-2">{person.ticketNumber}</td>
                  <td className="border border-gray-300 p-2">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={person.firstName}
                        onChange={(e) => updatePerson(index, "firstName", e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    ) : (
                      person.firstName
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={person.lastName}
                        onChange={(e) => updatePerson(index, "lastName", e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    ) : (
                      person.lastName
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={person.dni}
                        onChange={(e) => updatePerson(index, "dni", e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    ) : (
                      person.dni
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={person.phone}
                        onChange={(e) => updatePerson(index, "phone", e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    ) : (
                      person.phone
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={person.address}
                        onChange={(e) => updatePerson(index, "address", e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    ) : (
                      person.address
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">{formatDateTime(person.createdAt)}</td>
                  <td className="border border-gray-300 p-2">
                    {editingIndex === index ? (
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                      className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                    >
                      {expandedRow === index ? "Ocultar Ticket" : "Mostrar Ticket"}
                    </button>
                  </td>
                </tr>
                {expandedRow === index && (
                  <tr>
                    <td colSpan="8" className="p-4">
                      <div className="flex flex-col items-center">
                        {/* Ticket con diseño */}
                        <div ref={(el) => (ticketRefs.current[index] = el)} className="relative w-[900px] h-[300px]">
                          {/* Imagen de fondo del ticket */}
                          <img src={ticketImage} alt="Ticket" className="w-full h-full" />
                          {/* Datos sobre el ticket */}
                          <div className="absolute top-1.5 right-20 text-red-500 font-bold text-lg">{person.ticketNumber}</div>
                          <div className="absolute bottom-56.5 right-15 text-black font-semibold text-sm">{person.firstName}</div>
                          <div className="absolute bottom-44.5 right-18 text-black font-semibold text-sm">{person.lastName}</div>
                          <div className="absolute bottom-4.5 right-4 text-black font-semibold text-sm">{person.address}</div>
                          <div className="absolute bottom-19 right-22 text-black font-semibold text-sm">{person.phone}</div>
                          <div className="absolute bottom-31.5 right-25 text-black font-semibold text-sm">{person.dni}</div>
                        </div>
                        {/* Botón para descargar el ticket */}
                        <button
                          onClick={() => generateImage(index)}
                          className="mt-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                        >
                          Descargar Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketGenerator;