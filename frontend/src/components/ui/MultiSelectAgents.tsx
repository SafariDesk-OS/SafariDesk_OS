import React, { useState, useEffect } from 'react';
import { AgentType } from '../../types/agents';

interface MultiSelectAgentsProps {
  agents: AgentType[];
  selectedAgents: number[];
  onChange: (selected: number[]) => void;
  label: string;
  placeholder?: string;
}

const MultiSelectAgents: React.FC<MultiSelectAgentsProps> = ({
  agents,
  selectedAgents,
  onChange,
  label,
  placeholder = "Select agents...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = () => setIsOpen(!isOpen);

  const handleAgentToggle = (agentId: number) => {
    const newSelection = selectedAgents.includes(agentId)
      ? selectedAgents.filter((id) => id !== agentId)
      : [...selectedAgents, agentId];
    onChange(newSelection);
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAgentNames = selectedAgents
    .map((id) => agents.find((agent) => agent.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <button
        type="button"
        className="flex justify-between items-center w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 dark:text-gray-100"
        onClick={handleToggle}
      >
        <span className="block truncate text-gray-900 dark:text-gray-100">
          {selectedAgentNames.length > 0
            ? selectedAgentNames.join(', ')
            : placeholder}
        </span>
        <svg
          className="-mr-1 ml-2 h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-2">
            <input
              type="text"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul
            tabIndex={-1}
            role="listbox"
            aria-labelledby="listbox-label"
            className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          >
            {filteredAgents.length === 0 ? (
              <li className="text-gray-900 dark:text-gray-100 relative py-2 pl-3 pr-9">
                No agents found.
              </li>
            ) : (
              filteredAgents.map((agent) => (
                <li
                  key={agent.id}
                  className="text-gray-900 dark:text-gray-100 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleAgentToggle(agent.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedAgents.includes(agent.id)}
                      className="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                    />
                    <span className="ml-3 block font-normal truncate">
                      {agent.name}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectAgents;
