import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Code2, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router';

interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  languages: string[];
  timeLimit: number;
  usageCount: number;
  averageScore: number;
}

const mockQuestions: Question[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Array',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    languages: ['Python', 'JavaScript', 'Java', 'C++'],
    timeLimit: 30,
    usageCount: 145,
    averageScore: 82,
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    difficulty: 'Medium',
    category: 'Stack',
    description: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    languages: ['Python', 'JavaScript', 'Java'],
    timeLimit: 45,
    usageCount: 98,
    averageScore: 75,
  },
  {
    id: '3',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Hard',
    category: 'Tree',
    description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values.',
    languages: ['Python', 'JavaScript', 'C++'],
    timeLimit: 60,
    usageCount: 67,
    averageScore: 68,
  },
  {
    id: '4',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    category: 'Linked List',
    description: 'Merge two sorted linked lists and return it as a sorted list.',
    languages: ['Python', 'JavaScript', 'Java', 'C++'],
    timeLimit: 30,
    usageCount: 132,
    averageScore: 85,
  },
  {
    id: '5',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'String',
    description: 'Find the length of the longest substring without repeating characters.',
    languages: ['Python', 'JavaScript', 'Java'],
    timeLimit: 45,
    usageCount: 89,
    averageScore: 71,
  },
];

export function QuestionBank() {
  const { user } = useAuth();
  const [questions] = useState<Question[]>(mockQuestions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const categories = Array.from(new Set(questions.map(q => q.category)));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-[#10B981]';
      case 'Medium': return 'text-[#F59E0B]';
      case 'Hard': return 'text-[#EF4444]';
      default: return 'text-[#94A3B8]';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      {/* Header */}
      <div className="border-b border-[#334155] bg-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-lg text-[#F8FAFC]">Question Bank</h1>
              <p className="text-xs text-[#94A3B8]">{questions.length} total questions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Question
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg text-[#F8FAFC]">{question.title}</h3>
                    <span className={`text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <Badge variant="language">{question.category}</Badge>
                  </div>
                  <p className="text-sm text-[#94A3B8] mb-3">{question.description}</p>
                  <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                    <span>Languages: {question.languages.join(', ')}</span>
                    <span>•</span>
                    <span>Time Limit: {question.timeLimit}m</span>
                    <span>•</span>
                    <span>Used {question.usageCount} times</span>
                    <span>•</span>
                    <span>Avg Score: {question.averageScore}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-12 text-center">
              <p className="text-[#94A3B8]">No questions found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl text-[#F8FAFC] mb-6">Create New Question</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Question Title</label>
                <Input type="text" placeholder="e.g., Two Sum" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5 text-[#F8FAFC]">Difficulty</label>
                  <select className="w-full px-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1.5 text-[#F8FAFC]">Category</label>
                  <select className="w-full px-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                    <option>Array</option>
                    <option>String</option>
                    <option>Stack</option>
                    <option>Tree</option>
                    <option>Linked List</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Description</label>
                <textarea
                  className="w-full px-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] min-h-[100px]"
                  placeholder="Describe the problem..."
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Time Limit (minutes)</label>
                <Input type="number" placeholder="30" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateModal(false)} className="flex-1">
                  Create Question
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
