export class ChatState {
    constructor() {
        this.currentStep = 'project_type';
        this.userData = {
            userId: null,
            name: '',
            email: '',
            phone: '',
            project_type: '',
            requirements: '',
            budget: '',
            messages: [],
            status: 'new'
        };
    }

    setUserId(userId) {
        this.userData.userId = userId;
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentQuestion() {
        switch (this.currentStep) {
            case 'project_type':
                return 'Який тип проекту вас цікавить? (вебсайт, мобільний додаток, лендінг тощо)';
            case 'requirements':
                return 'Опишіть, будь ласка, основні вимоги до вашого проекту.';
            case 'budget':
                return 'Який у вас орієнтовний бюджет на проект? (опціонально)';
            case 'contact_info':
                return 'Для продовження, будь ласка, вкажіть ваше ім\'я, email та номер телефону у форматі:\nІм\'я: [ваше ім\'я]\nEmail: [ваш email]\nТелефон: [ваш номер]';
            default:
                return null;
        }
    }

    processAnswer(answer) {
        switch (this.currentStep) {
            case 'project_type':
                this.userData.project_type = answer;
                this.currentStep = 'requirements';
                break;
            case 'requirements':
                this.userData.requirements = answer;
                this.currentStep = 'budget';
                break;
            case 'budget':
                this.userData.budget = answer;
                this.currentStep = 'contact_info';
                break;
            case 'contact_info':
                const contactInfo = this.parseContactInfo(answer);
                if (contactInfo) {
                    this.userData.name = contactInfo.name;
                    this.userData.email = contactInfo.email;
                    this.userData.phone = contactInfo.phone;
                    this.currentStep = 'completed';
                }
                break;
        }
    }

    parseContactInfo(text) {
        const nameMatch = text.match(/Ім'я:\s*([^\n]+)/i);
        const emailMatch = text.match(/Email:\s*([^\n]+)/i);
        const phoneMatch = text.match(/Телефон:\s*([^\n]+)/i);

        if (nameMatch && emailMatch && phoneMatch) {
            return {
                name: nameMatch[1].trim(),
                email: emailMatch[1].trim(),
                phone: phoneMatch[1].trim()
            };
        }
        return null;
    }

    addMessage(role, content) {
        this.userData.messages.push({
            role,
            content,
            timestamp: Date.now()
        });
    }

    isCompleted() {
        return this.currentStep === 'completed';
    }

    getData() {
        return { ...this.userData };
    }
} 