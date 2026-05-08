import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useLanguage } from "@/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background py-12 px-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            {t('privacy.backToLogin')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="text-primary-foreground" size={20} />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">{t('privacy.title')}</h1>
          </div>
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[32px] p-8 md:p-12 shadow-xl border border-border"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-4 text-card-foreground">
                <Lock className="text-primary" size={20} />
                {t('privacy.section1Title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.section1Text')}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>{t('privacy.section1Item1')}</li>
                <li>{t('privacy.section1Item2')}</li>
                <li>{t('privacy.section1Item3')}</li>
                <li>{t('privacy.section1Item4')}</li>
                <li>{t('privacy.section1Item5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-4 text-card-foreground">
                <Eye className="text-primary" size={20} />
                {t('privacy.section2Title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.section2Text')}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>{t('privacy.section2Item1')}</li>
                <li>{t('privacy.section2Item2')}</li>
                <li>{t('privacy.section2Item3')}</li>
                <li>{t('privacy.section2Item4')}</li>
                <li>{t('privacy.section2Item5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-4 text-card-foreground">
                <Shield className="text-primary" size={20} />
                {t('privacy.section3Title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.section3Text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-4 text-card-foreground">
                <FileText className="text-primary" size={20} />
                {t('privacy.section4Title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.section4Text')}
              </p>
            </section>

            <section className="pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                {t('privacy.lastUpdated', { date: 'April 6, 2026' })}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
