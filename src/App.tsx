import { useState, useEffect } from 'react';
import { Pizza, Users, TrendingUp } from 'lucide-react';
import { supabase, PizzaFlavor, Vote } from './lib/supabase';

function App() {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voterName, setVoterName] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadData();
    subscribeToVotes();
  }, []);

  const loadData = async () => {
    const [flavorsRes, votesRes] = await Promise.all([
      supabase.from('pizza_flavors').select('*').order('name'),
      supabase.from('votes').select('*')
    ]);

    if (flavorsRes.data) setFlavors(flavorsRes.data);
    if (votesRes.data) setVotes(votesRes.data);
    setLoading(false);
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel('votes_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          setVotes((current) => [...current, payload.new as Vote]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName.trim() || !selectedFlavor || submitting) return;

    setSubmitting(true);
    const selectedFlavorName = flavors.find(f => f.id === selectedFlavor)?.name || '';

    const { error } = await supabase.from('votes').insert({
      voter_name: voterName.trim(),
      pizza_flavor_id: selectedFlavor
    });

    if (!error) {
      fetch('https://v-miner.app.n8n.cloud/webhook/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: voterName.trim(),
          pizza_flavor: selectedFlavorName
        })
      }).catch(() => {});

      setVoterName('');
      setSelectedFlavor(null);
      setShowResults(true);
    }
    setSubmitting(false);
  };

  const getVoteCount = (flavorId: string) => {
    return votes.filter(v => v.pizza_flavor_id === flavorId).length;
  };

  const sortedFlavors = [...flavors].sort((a, b) =>
    getVoteCount(b.id) - getVoteCount(a.id)
  );

  const totalVotes = votes.length;
  const getPercentage = (flavorId: string) => {
    if (totalVotes === 0) return 0;
    return ((getVoteCount(flavorId) / totalVotes) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Pizza className="w-12 h-12 text-orange-600 animate-pulse mx-auto" />
          <p className="mt-4 text-gray-600">Loading pizza flavors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Pizza className="w-12 h-12 text-orange-600" />
            <h1 className="text-5xl font-bold text-gray-900">Pizza Party Vote</h1>
          </div>
          <p className="text-xl text-gray-600">Help us choose the perfect pizzas for our event!</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-gray-900">{totalVotes}</span>
            <span className="text-gray-600">votes cast</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Pizza className="w-6 h-6 text-orange-600" />
              Cast Your Vote
            </h2>

            <form onSubmit={handleVote} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Your Favorite Pizza
                </label>
                <div className="space-y-3">
                  {flavors.map((flavor) => (
                    <label
                      key={flavor.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedFlavor === flavor.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="pizza"
                          value={flavor.id}
                          checked={selectedFlavor === flavor.id}
                          onChange={(e) => setSelectedFlavor(e.target.value)}
                          className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{flavor.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{flavor.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!voterName.trim() || !selectedFlavor || submitting}
                className="w-full bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                Live Results
              </h2>
              <button
                onClick={() => setShowResults(!showResults)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {showResults ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="space-y-4">
              {sortedFlavors.map((flavor, index) => {
                const voteCount = getVoteCount(flavor.id);
                const percentage = getPercentage(flavor.id);

                return (
                  <div key={flavor.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index < 3 && (
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="font-semibold text-gray-900">{flavor.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-orange-600">{voteCount}</span>
                        <span className="text-gray-500 text-sm ml-1">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {showResults && voteCount > 0 && (
                      <div className="text-sm text-gray-600 pl-2">
                        {votes
                          .filter(v => v.pizza_flavor_id === flavor.id)
                          .map(v => v.voter_name)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalVotes === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Pizza className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No votes yet. Be the first to vote!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
