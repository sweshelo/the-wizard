import { useUnitSelection } from '@/hooks/unit-selection';
import type { IUnit } from '@/submodule/suit/types';

interface UnitSelectionButtonProps {
  unitId: string;
}

export const UnitSelectionButton = ({ unitId }: UnitSelectionButtonProps) => {
  const { candidate, selectionMode, handleSelected } = useUnitSelection();

  // Don't render if this unit is not the selected one
  if (!candidate?.find((unit: IUnit) => unit.id === unitId) || !handleSelected) {
    return null;
  }

  // Determine button text and color based on selection mode
  const buttonConfig = {
    select: {
      text: '選択',
      bgColor: 'bg-white',
      textColor: 'text-black',
      borderColor: 'border-gray-500',
    },
    target: {
      text: 'ターゲット',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-700',
    },
    block: {
      text: 'ブロック',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      borderColor: 'border-blue-700',
    },
  };

  const config = buttonConfig[selectionMode];

  return (
    <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-auto px-2">
      <button
        className={`selection-button ${config.bgColor} ${config.textColor} py-1 rounded-md 
          shadow-md border ${config.borderColor} hover:brightness-105 w-full opacity-80`}
        onClick={() => {
          handleSelected(unitId);
          console.log('button clicked');
        }}
      >
        {config.text}
      </button>
    </div>
  );
};
