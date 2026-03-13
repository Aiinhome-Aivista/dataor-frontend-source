import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentWorkflow } from '../features/workflow';
import { ConnectorForm } from '../features/connectors';
import { MainContentProps } from '../types/layout';

export const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  workflowKey,
  chatKey,
  initialChatMessage,
  selectedConnector,
  handleWorkflowComplete,
  changeTab,
  handleBackToConnectors,
  handleStartWorkflow,
  handleForwardWithContext
}) => {
  return (
    <div className={`p-4 w-full ${activeTab === 'chat' ? 'max-w-none' : 'max-w-6xl mx-auto'}`}>
      <AnimatePresence mode="wait">
        {activeTab === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-8rem)]"
          >
            <AgentWorkflow
              key={`chat-${workflowKey}-${chatKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="query"
              onChangeTab={changeTab}
              initialChatMessage={initialChatMessage}
            />
          </motion.div>
        ) : activeTab === 'new-connector' ? (
          <motion.div
            key="new-connector"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ConnectorForm
              onBack={handleBackToConnectors}
              onTestSuccess={handleStartWorkflow}
            />
          </motion.div>
        ) : activeTab === 'collection' ? (
          <motion.div
            key="collection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-8rem)]"
          >
            <AgentWorkflow
              key={`ingest-${workflowKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="ingest"
              onChangeTab={changeTab}
            />
          </motion.div>
        ) : activeTab === 'analysis' ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-8rem)]"
          >
            <AgentWorkflow
              key={`analysis-${workflowKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="analyze"
              onChangeTab={changeTab}
              onForwardWithContext={handleForwardWithContext}
            />
          </motion.div>
        ) : activeTab === 'connectors' ? (
          <motion.div
            key="connectors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-8rem)]"
          >
            <AgentWorkflow
              key={`connectors-${workflowKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="connect"
              onChangeTab={changeTab}
              onNewConnector={() => changeTab('new-connector')}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
