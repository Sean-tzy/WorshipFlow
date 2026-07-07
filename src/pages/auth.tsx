import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Chrome, Lock, Mail, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/button";
import { Page } from "../components/motion";
import { api } from "../lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

type AuthMode = "login" | "register" | "forgot" | "reset";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const title =
    mode === "register" ? "Create your church workspace" : mode === "forgot" ? "Recover your account" : "Welcome back";
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <Page className="grid min-h-screen place-items-center bg-ink px-4 py-12 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.3),transparent_32%),radial-gradient(circle_at_75%_70%,rgba(52,211,153,0.14),transparent_28%),#09090B]" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-[28px] border border-white/12 bg-[#111113]/85 p-6 shadow-soft backdrop-blur-2xl"
      >
        <Link to="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet via-azure to-mint text-ink">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold">WorshipFlow AI</span>
        </Link>
        <h1 className="font-display text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Secure Sanctum-ready authentication with polished states.</p>
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              const path = mode === "register" ? "/auth/register" : mode === "forgot" ? "/auth/forgot-password" : "/auth/login";
              const response = await api(path, { method: "POST", body: JSON.stringify(values) });
              toast.success(response.message);
              if (mode !== "forgot") navigate("/app");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Authentication failed");
            }
          })}
          className="mt-7 space-y-4"
        >
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Email</span>
            <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <Mail className="h-4 w-4 text-zinc-500" />
              <input {...register("email")} className="w-full bg-transparent outline-none" placeholder="you@church.org" />
            </span>
            {formState.errors.email && <span className="mt-2 block text-xs text-red-300">Enter a valid email.</span>}
          </label>
          {mode !== "forgot" && (
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-400">Password</span>
              <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <Lock className="h-4 w-4 text-zinc-500" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-transparent outline-none"
                  placeholder="Minimum 8 characters"
                />
              </span>
            </label>
          )}
          {mode === "login" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-zinc-400">
                <input type="checkbox" className="rounded border-white/20 bg-white/10" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-mint">
                Forgot password?
              </Link>
            </div>
          )}
          <Button className="w-full">{mode === "forgot" ? "Send reset link" : mode === "register" ? "Create account" : "Login"}</Button>
          <Button type="button" variant="secondary" className="w-full" onClick={() => toast.success("Google OAuth button is ready for provider credentials")}>
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "register" ? "Already have an account?" : "New to WorshipFlow?"}{" "}
          <Link className="text-white" to={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Login" : "Create one"}
          </Link>
        </p>
      </motion.div>
    </Page>
  );
}
