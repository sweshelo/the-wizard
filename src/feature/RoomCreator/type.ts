import type { Rule } from '@/submodule/suit/types';

// Extend the Rule type to include the debug.enable property
export type ExtendedRule = Rule & {
  debug: {
    enable: boolean;
    reveal: {
      opponent: {
        deck: boolean;
        hand: boolean;
        trigger: boolean;
        trash: boolean;
      };
      self: {
        deck: boolean;
      };
    };
  };
};

export type RoomCreatorFormParams = { name: string; rule: ExtendedRule };
