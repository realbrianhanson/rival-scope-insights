import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-foreground" style={{ letterSpacing: "-0.02em" }}>RivalScope</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Reset your password</h2>
          {sent ? (
            <p className="text-sm text-muted-foreground">Check your email for a reset link.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>Send Reset Link</Button>
            </form>
          )}
          <Link to="/auth" className="block text-center text-sm text-primary hover:underline mt-4">Back to sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
