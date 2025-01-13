// @ts-ignore: Dynamic import workaround for ESM module compatibility
import chalk from 'chalk';
import { table } from 'table';
import { WorkflowState } from './state';
import { isToolCallRequest } from './tool_calls';
import { _t } from './translations/_translations'; // Import funkcji tłumaczeń
import { locale } from './translations/telemetry'; // Import tłumaczeń
import { Message } from './messages'; // Import typu Message

export type Telemetry = ({
  prevState,
  nextState,
}: {
  prevState: WorkflowState;
  nextState: WorkflowState;
}) => void;

export const logger: Telemetry = ({ prevState, nextState }) => {
  if (prevState === nextState) return;

  const getStatusText = (state: WorkflowState) => {
    if (state.agent === 'supervisor') {
      return _t('Szukam kolejnego zadania...', locale);
    }
    if (state.agent === 'resourcePlanner') {
      return _t('Szukam najlepszego agenta...', locale);
    }
    switch (state.status) {
      case 'idle':
      case 'running': {
        const lastMessage = state.messages.at(-1)!;
        if (lastMessage.role === 'tool') {
          return _t('Przetwarzam odpowiedź narzędzia...', locale);
        }
        return _t('Pracuję nad: ${content}', locale, { content: lastMessage.content });
      }
      case 'paused': {
        const lastMessage = state.messages.at(-1)!;
        if (isToolCallRequest(lastMessage)) {
          const tools = lastMessage.tool_calls.map((toolCall) => toolCall.function.name).join(', ');
          return _t('Oczekiwanie na narzędzia: ${tools}', locale, { tools });
        }
        return _t('Wstrzymane', locale);
      }
      case 'finished':
        return _t('Zakończono', locale);
      case 'failed':
        return _t('Niepowodzenie', locale);
    }
  };

  const printMessages = (messages: Message[]) => {
    if (messages.length === 0) return;
  
    const rows = messages.map((message) => [
      chalk.gray(`[${message.role}]`),
      chalk.gray(message.content),
    ]);
  
    const config:any = {
      border: {
        topBody: chalk.gray('─'),
        topJoin: chalk.gray('┬'),
        topLeft: chalk.gray('┌'),
        topRight: chalk.gray('┐'),
        bottomBody: chalk.gray('─'),
        bottomJoin: chalk.gray('┴'),
        bottomLeft: chalk.gray('└'),
        bottomRight: chalk.gray('┘'),
        bodyLeft: ' ',
        bodyRight: ' ',
        bodyJoin: ' ',
        joinBody: ' ',
        joinLeft: ' ',
        joinRight: ' ',
        joinJoin: ' ',
      },
      columns: {
        0: { alignment: 'left', width: 12 },
        1: { alignment: 'left', width: 92 },
      },
    };
  
    console.log(table(rows, config));
  };
  

  const printTree = (state: WorkflowState, level = 0) => {
    const indent = '  '.repeat(level);
    const arrow = level > 0 ? '└─▶ ' : '';
    const statusText = state.children.length > 0 ? '' : getStatusText(state);

    console.log(`${indent}${arrow}${chalk.bold.green(state.agent)} ${statusText}`);

    // Log messages for this state as a formatted table
    printMessages(state.messages);

    state.children.forEach((child) => printTree(child, level + 1));
  };

  printTree(nextState);
  console.log(''); // Empty line for better readability
};
