import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import ticketImage from '../img/ticket.png'; // Importa la imagen del ticket

function TicketGenerator() {
  const [people, setPeople] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
  });
  const [ticketNumber, setTicketNumber] = useState(1);
  const [editingPerson, setEditingPerson] = useState(null);
  const ticketRefs = useRef([]);

  useEffect(() => {
    const savedNumber = localStorage.getItem("ticketNumber");
    if (savedNumber && !isNaN(parseInt(savedNumber))) {
      setTicketNumber(parseInt(savedNumber));
    }
  }, []);

  useEffect(() => {
    return () => {
      ticketRefs.current = []; // Limpiar referencias al desmontar
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.toUpperCase() });
  };

  const addPerson = () => {
    if (!formData.firstName || !formData.lastName || !formData.dni || !formData.phone) {
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

    setPeople([...people, newPerson]);
    setTicketNumber(ticketNumber + 1);
    localStorage.setItem("ticketNumber", ticketNumber + 1);
    setFormData({ firstName: "", lastName: "", dni: "", phone: "" });
  };

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

  const exportToExcel = () => {
    try {
      const dataForExcel = people.map((person) => ({
        Ticket: person.ticketNumber,
        Nombres: person.firstName,
        Apellidos: person.lastName,
        DNI: person.dni,
        Teléfono: person.phone,
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

  const updatePerson = () => {
    const updatedPeople = people.map((person) =>
      person.id === editingPerson.id ? editingPerson : person
    );
    setPeople(updatedPeople);
    setEditingPerson(null);
  };

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
              <th className="border border-gray-300 p-2">Fecha y Hora</th>
              <th className="border border-gray-300 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="text-center">
                <td className="border border-gray-300 p-2">{person.ticketNumber}</td>
                <td className="border border-gray-300 p-2">{person.firstName}</td>
                <td className="border border-gray-300 p-2">{person.lastName}</td>
                <td className="border border-gray-300 p-2">{person.dni}</td>
                <td className="border border-gray-300 p-2">{person.phone}</td>
                <td className="border border-gray-300 p-2">{formatDateTime(person.createdAt)}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => setEditingPerson(person)}
                    className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded cursor-pointer"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario de edición */}
      {editingPerson && (
        <div className="w-full max-w-4xl p-4 border rounded bg-gray-100 mt-4">
          <h2 className="text-xl font-bold mb-4">Editar Ticket #{editingPerson.ticketNumber}</h2>
          <input
            type="text"
            name="firstName"
            placeholder="Nombres"
            value={editingPerson.firstName}
            onChange={(e) =>
              setEditingPerson({ ...editingPerson, firstName: e.target.value.toUpperCase() })
            }
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Apellidos"
            value={editingPerson.lastName}
            onChange={(e) =>
              setEditingPerson({ ...editingPerson, lastName: e.target.value.toUpperCase() })
            }
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="dni"
            placeholder="DNI"
            value={editingPerson.dni}
            onChange={(e) =>
              setEditingPerson({ ...editingPerson, dni: e.target.value.toUpperCase() })
            }
            className="p-2 border rounded m-2 w-full"
          />
          <input
            type="text"
            name="phone"
            placeholder="Teléfono"
            value={editingPerson.phone}
            onChange={(e) =>
              setEditingPerson({ ...editingPerson, phone: e.target.value.toUpperCase() })
            }
            className="p-2 border rounded m-2 w-full"
          />
          <button
            onClick={updatePerson}
            className="mt-2 p-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer w-full"
          >
            Actualizar
          </button>
          <button
            onClick={() => setEditingPerson(null)}
            className="mt-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer w-full"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Tickets generados */}
      <div className="w-full flex flex-wrap justify-center mt-8">
        {people.map((person, index) => (
          <div key={person.id} className="m-4">
            {/* Ticket con diseño */}
            <div ref={(el) => (ticketRefs.current[index] = el)} className="relative w-[900px] h-[300px]">
              {/* Imagen de fondo del ticket */}
              <img src={ticketImage} alt="Ticket" className="w-full h-full" />

              {/* Datos sobre el ticket */}
              <div className="absolute top-2.5 right-20 text-red-600 font-bold text-lg">{person.ticketNumber}</div>
              <div className="absolute bottom-53.5 right-25 text-black font-semibold">{person.firstName}</div>
              <div className="absolute bottom-39.5 right-20 text-black font-semibold">{person.lastName}</div>
              <div className="absolute bottom-25.5 right-25 text-black font-semibold">{person.dni}</div>
              <div className="absolute bottom-11.5 right-22 text-black font-semibold">{person.phone}</div>
            </div>

            {/* Botón para descargar el ticket */}
            <button onClick={() => generateImage(index)} className="mt-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">
              Descargar Ticket
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TicketGenerator;