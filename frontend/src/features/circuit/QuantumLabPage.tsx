/**
 * QUANTUMANIA - Quantum Lab & Circuit Builder Page
 * Integrated with the mature QuantumLab Workspace.
 * Preserves navigation, authentication, and learning integration.
 */

import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QuantumLabWorkspace } from './components/QuantumLabWorkspace';
import { getTemplateById } from './domain/circuitTemplates';
import { CanonicalCircuit } from '../../types/circuit';

export const QuantumLabPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template');
  const topicParam = searchParams.get('topic');
  const taskParam = searchParams.get('task') || searchParams.get('lesson') || searchParams.get('title');
  const lessonId = searchParams.get('lesson_id') || undefined;
  const labProblemId = searchParams.get('lab_problem_id') || searchParams.get('problem_id') || undefined;

  const initialCircuit: CanonicalCircuit | null = useMemo(() => {
    if (templateId) {
      const tpl = getTemplateById(templateId);
      if (tpl) return tpl.circuit;
    }
    return null;
  }, [templateId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080b14',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <QuantumLabWorkspace
        initialCircuit={initialCircuit}
        initialTopic={topicParam || (templateId ? `Template: ${templateId}` : 'Superposition and Bell State (|Φ⁺⟩)')}
        initialTask={taskParam || 'Use the Hadamard gate (H) on qubit q0 and CNOT (CX) to create a maximally entangled Bell state.'}
        lessonId={lessonId}
        labProblemId={labProblemId}
        onEndLab={() => {
          if (lessonId) {
            navigate(`/app/learn/lessons/${lessonId}`);
          } else {
            navigate('/app/learn');
          }
        }}
      />
    </div>
  );
};
