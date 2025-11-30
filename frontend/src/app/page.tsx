'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Leaf, TrendingUp, Shield, Zap } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Leaf className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Carbon Offset Marketplace
              <span className="gradient-text-carbon block mt-2">2.0</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Trade verified carbon credits on Aptos blockchain with AI-powered emission tracking
              and IoT environmental verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="btn-carbon text-lg px-8 py-3"
              onClick={() => router.push('/auth/register')}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3"
              onClick={() => router.push('/auth/login')}
            >
              Sign In
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100K+</div>
              <div className="text-sm text-muted-foreground">Carbon Credits Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Verified Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">IoT Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose Carbon Marketplace 2.0?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="card-hover">
              <CardHeader className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Blockchain Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Every carbon credit is tokenized on Aptos blockchain with immutable
                  transaction history and cryptographic proof.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Advanced machine learning models calculate emissions with 95% accuracy
                  and detect anomalies in real-time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>IoT Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Real-time environmental data from IoT sensors provides continuous
                  verification of project impact.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="text-center">
                <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Global Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Connect with verified carbon offset projects worldwide and track
                  your environmental impact in real-time.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your Aptos wallet to access the marketplace and start trading
                  verified carbon credits securely.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Calculate Emissions</h3>
                <p className="text-muted-foreground">
                  Use our AI-powered emission calculator to determine your carbon footprint
                  with industry-specific precision.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Trade & Retire</h3>
                <p className="text-muted-foreground">
                  Buy verified carbon credits from global projects and retire them
                  to offset your emissions with blockchain certificates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of companies and individuals committed to fighting climate change
            through verified carbon offset trading.
          </p>
          <Button
            size="lg"
            className="btn-carbon text-lg px-8 py-3"
            onClick={() => router.push('/auth/register')}
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Leaf className="w-6 h-6 text-primary mr-2" />
              <span className="font-semibold text-foreground">Carbon Marketplace 2.0</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Carbon Marketplace 2.0. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}