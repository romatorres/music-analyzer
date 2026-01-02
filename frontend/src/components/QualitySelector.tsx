import React from 'react';
import { Zap, Scale, Sparkles } from 'lucide-react';

interface QualitySelectorProps {
  value: 'fast' | 'balanced' | 'quality';
  onChange: (value: 'fast' | 'balanced' | 'quality') => void;
  disabled?: boolean;
}

const QualitySelector: React.FC<QualitySelectorProps> = ({ value, onChange, disabled = false }) => {
  const qualities = [
    {
      id: 'fast' as const,
      icon: Zap,
      label: 'Rápido',
      time: '1-3 min',
      quality: 'Boa',
      size: '~10MB',
      description: 'Ideal para preview e uso casual',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      hoverColor: 'hover:bg-yellow-100',
      selectedColor: 'bg-yellow-100 border-yellow-500',
    },
    {
      id: 'balanced' as const,
      icon: Scale,
      label: 'Balanceado',
      time: '5-8 min',
      quality: 'Ótima',
      size: '~10MB',
      description: 'Melhor custo-benefício (Recomendado)',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      hoverColor: 'hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500',
    },
    {
      id: 'quality' as const,
      icon: Sparkles,
      label: 'Máxima Qualidade',
      time: '15-20 min',
      quality: 'Perfeita',
      size: '~40MB',
      description: 'Produção profissional',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      hoverColor: 'hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-500',
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Qualidade de Processamento
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {qualities.map((q) => {
          const Icon = q.icon;
          const isSelected = value === q.id;
          
          return (
            <button
              key={q.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(q.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected 
                  ? q.selectedColor 
                  : `${q.bgColor} ${q.borderColor} ${!disabled && q.hoverColor}`
                }
              `}
            >
              {/* Badge "Recomendado" */}
              {q.id === 'balanced' && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Recomendado
                </div>
              )}
              
              {/* Ícone e Label */}
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${q.color}`} />
                <span className="font-semibold text-gray-900">{q.label}</span>
              </div>
              
              {/* Informações */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tempo:</span>
                  <span className="font-medium text-gray-900">{q.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Qualidade:</span>
                  <span className="font-medium text-gray-900">{q.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tamanho:</span>
                  <span className="font-medium text-gray-900">{q.size}</span>
                </div>
              </div>
              
              {/* Descrição */}
              <p className="mt-2 text-xs text-gray-500">
                {q.description}
              </p>
              
              {/* Indicador de seleção */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${q.color.replace('text-', 'bg-')}`} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Nota informativa */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <strong>Dica:</strong> O modo Balanceado oferece o melhor equilíbrio entre velocidade e qualidade para a maioria dos casos.
        Use Rápido para testes e Máxima Qualidade apenas quando precisar da melhor separação possível.
      </div>
    </div>
  );
};

export default QualitySelector;
