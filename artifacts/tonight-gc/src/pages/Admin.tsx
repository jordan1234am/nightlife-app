import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { getVenues, saveVenue, deleteVenue, Venue, VIBES, SUBURBS, VibeType, SuburbType } from "@/data/venues";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialFormState: Omit<Venue, "id"> = {
  name: "",
  suburb: "Surfers Paradise",
  vibes: [],
  priceLevel: 2,
  crowdLevel: "Medium",
  bestArrivalTime: "9pm",
  bestNights: ["Friday", "Saturday"],
  dressCode: "Smart casual",
  musicType: "",
  description: "",
  imageUrl: "",
  goodFor: [],
  notIdealFor: [],
  recommendedReason: "",
};

export default function Admin() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Venue, "id">>(initialFormState);
  
  // Custom inputs for arrays
  const [goodForInput, setGoodForInput] = useState("");
  const [notIdealForInput, setNotIdealForInput] = useState("");
  const [bestNightsInput, setBestNightsInput] = useState("Friday, Saturday");
  
  const { toast } = useToast();

  const loadVenues = () => {
    setVenues(getVenues());
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const resetForm = () => {
    setFormData(initialFormState);
    setGoodForInput("");
    setNotIdealForInput("");
    setBestNightsInput("Friday, Saturday");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (venue: Venue) => {
    setFormData({
      name: venue.name,
      suburb: venue.suburb,
      vibes: venue.vibes,
      priceLevel: venue.priceLevel,
      crowdLevel: venue.crowdLevel,
      bestArrivalTime: venue.bestArrivalTime,
      bestNights: venue.bestNights,
      dressCode: venue.dressCode,
      musicType: venue.musicType,
      description: venue.description,
      imageUrl: venue.imageUrl,
      goodFor: venue.goodFor,
      notIdealFor: venue.notIdealFor,
      recommendedReason: venue.recommendedReason,
    });
    
    setGoodForInput(venue.goodFor.join(", "));
    setNotIdealForInput(venue.notIdealFor.join(", "));
    setBestNightsInput(venue.bestNights.join(", "));
    
    setEditingId(venue.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this venue? (Note: SEED venues can't be deleted from localStorage)")) {
      deleteVenue(id);
      loadVenues();
      toast({
        title: "Venue deleted",
        description: "The custom venue has been removed.",
      });
    }
  };

  const toggleVibe = (vibe: VibeType) => {
    setFormData(prev => {
      const current = prev.vibes;
      if (current.includes(vibe)) {
        return { ...prev, vibes: current.filter(v => v !== vibe) };
      } else {
        return { ...prev, vibes: [...current, vibe] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    
    if (formData.vibes.length === 0) {
      toast({ title: "Error", description: "Select at least one vibe", variant: "destructive" });
      return;
    }

    const id = editingId || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const venueToSave: Venue = {
      ...formData,
      id,
      goodFor: goodForInput.split(",").map(s => s.trim()).filter(Boolean),
      notIdealFor: notIdealForInput.split(",").map(s => s.trim()).filter(Boolean),
      bestNights: bestNightsInput.split(",").map(s => s.trim()).filter(Boolean),
    };
    
    saveVenue(venueToSave);
    loadVenues();
    resetForm();
    
    toast({
      title: "Success!",
      description: `Venue ${isEditing ? 'updated' : 'added'} successfully.`,
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24 md:pb-12 md:pt-16">
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black font-display text-white mb-2">Admin</h1>
          <p className="text-muted-foreground">Manage your custom venues. (Saved to localStorage)</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="bg-card/50 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Venue' : 'Add New Venue'}</CardTitle>
                <CardDescription>Fill out the details to add a new spot to the GC map.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Venue Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="e.g. The Pink Flamingo"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suburb">Suburb</Label>
                      <select 
                        id="suburb"
                        className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.suburb}
                        onChange={(e) => setFormData({...formData, suburb: e.target.value as SuburbType})}
                      >
                        {SUBURBS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Vibes */}
                  <div className="space-y-2">
                    <Label>Vibes (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {VIBES.map(vibe => (
                        <button
                          key={vibe}
                          type="button"
                          onClick={() => toggleVibe(vibe)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            formData.vibes.includes(vibe) 
                              ? 'bg-primary/20 border-primary text-primary' 
                              : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Price Level</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                        value={formData.priceLevel}
                        onChange={(e) => setFormData({...formData, priceLevel: Number(e.target.value) as 1|2|3})}
                      >
                        <option value={1}>$ (Cheap)</option>
                        <option value={2}>$$ (Moderate)</option>
                        <option value={3}>$$$ (Expensive)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Crowd Level</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                        value={formData.crowdLevel}
                        onChange={(e) => setFormData({...formData, crowdLevel: e.target.value as "Low"|"Medium"|"High"})}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Best Arrival</Label>
                      <Input 
                        value={formData.bestArrivalTime} 
                        onChange={(e) => setFormData({...formData, bestArrivalTime: e.target.value})} 
                        placeholder="e.g. 10pm"
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <Label>Short Pitch (for card)</Label>
                    <Input 
                      value={formData.recommendedReason} 
                      onChange={(e) => setFormData({...formData, recommendedReason: e.target.value})} 
                      placeholder="Why should they go tonight?"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Detailed description of the venue..."
                      className="min-h-[100px] bg-background/50"
                    />
                  </div>

                  {/* Arrays as CSVs */}
                  <div className="space-y-4 border p-4 rounded-md border-border/50 bg-background/30">
                    <div className="space-y-2">
                      <Label>Good For (comma separated)</Label>
                      <Input 
                        value={goodForInput} 
                        onChange={(e) => setGoodForInput(e.target.value)} 
                        placeholder="Groups, Dancing, Cocktails"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Not Ideal For (comma separated)</Label>
                      <Input 
                        value={notIdealForInput} 
                        onChange={(e) => setNotIdealForInput(e.target.value)} 
                        placeholder="Quiet dates, Early birds"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Best Nights (comma separated)</Label>
                      <Input 
                        value={bestNightsInput} 
                        onChange={(e) => setBestNightsInput(e.target.value)} 
                        placeholder="Friday, Saturday"
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Music Type</Label>
                      <Input 
                        value={formData.musicType} 
                        onChange={(e) => setFormData({...formData, musicType: e.target.value})} 
                        placeholder="e.g. RnB, House"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dress Code</Label>
                      <Input 
                        value={formData.dressCode} 
                        onChange={(e) => setFormData({...formData, dressCode: e.target.value})} 
                        placeholder="e.g. Smart Casual"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Image URL (Optional)</Label>
                    <Input 
                      value={formData.imageUrl} 
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                      placeholder="https://..."
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1">
                      {isEditing ? 'Update Venue' : 'Add Venue'}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1 space-y-4">
            <h3 className="font-display font-bold text-xl text-white">Saved Venues</h3>
            <p className="text-sm text-muted-foreground mb-4">Total: {venues.length} ({venues.length - 8} custom)</p>
            
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {venues.map(venue => {
                const isCustom = !["surfers-pavilion", "cali-beach", "the-avenue", "burleigh-pavilion", "miami-marketta", "loose-moose", "justin-lane", "coolangatta-hotel"].includes(venue.id);
                
                return (
                  <div key={venue.id} className={`p-3 rounded-lg border ${isCustom ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/30'}`}>
                    <div className="font-bold text-sm text-white mb-1">{venue.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">{venue.suburb}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="h-7 text-xs flex-1" onClick={() => handleEdit(venue)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      {isCustom && (
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => handleDelete(venue.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
