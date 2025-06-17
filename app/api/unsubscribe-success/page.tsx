export default function UnsubscribeSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Inscrição cancelada com sucesso!
        </h1>
        <p className="text-gray-700 mb-4">
          Você não receberá mais nossos e-mails com as vagas diárias.
        </p>
        <p className="text-gray-600">
          Caso tenha sido um engano, você pode se 
          <a 
            href="/subscribe" 
            className="text-blue-600 hover:underline ml-1"
          >
            inscrever novamente
          </a>.
        </p>
      </div>
    </div>
  );
}