'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PubliqueUmaVaga() {
  const [formData, setFormData] = useState({
    linkVaga: '',
    nomeEmpresa: '',
    cambio: 'BRL',
    tipoVaga: 'nacional',
    stack: '',
    seniorityLevel: '',
    cargo: '',
    descricao: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <p className={`font-caprasimo caprasimo-regular text-6xl sm:text-6xl text-[#ff914d] font-bold text-center mb-4`}>
        vaguinhas
      </p>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Publique uma vaguinha</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Link da vaga e Nome da empresa */}
            <div className='flex flex-col md:flex-row justify-evenly items-center gap-6'>
              <div className='w-full'>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Link da vaga <span className="text-red-500">*</span>
                </Label>
                <input
                  type="url"
                  name="linkVaga"
                  value={formData.linkVaga}
                  onChange={handleInputChange}
                  placeholder="https://linkdavaga.com.br"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className='w-full'>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da empresa <span className="text-red-500">*</span>
                </Label>
                <input
                  type="text"
                  name="nomeEmpresa"
                  value={formData.nomeEmpresa}
                  onChange={handleInputChange}
                  placeholder="Qual empresa está contratando?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Cargo - Full width */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo <span className="text-red-500">*</span>
              </Label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                placeholder="React Developer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Qual o profissional perfeito para a vaga?</p>
            </div>

            {/* Stack and Seniority Level - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Área <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.stack} 
                  onValueChange={(value) => handleSelectChange('stack', value)} 
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione sua área" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'frontend',
                      'backend',
                      'fullstack',
                      'mobile',
                      'dados',
                      'design'
                    ].map(area => (
                      <SelectItem key={area} value={area}>
                        {area === 'design' ? 'Designer UI/UX' : 
                         area === 'dados' ? 'Ciência de Dados' :
                         area.charAt(0).toUpperCase() + area.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível Profissional <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.seniorityLevel} 
                  onValueChange={(value) => handleSelectChange('seniorityLevel', value)} 
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione seu nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {["junior", "pleno", "senior"].map(level => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição - Shadcn Textarea */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descreva a vaga, requisitos, benefícios, etc..."
                className="min-h-[150px] w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Inclua detalhes importantes sobre a vaga, responsabilidades, requisitos e benefícios
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all transform hover:scale-105"
              >
                Enviar
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}